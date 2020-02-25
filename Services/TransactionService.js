const Transaction = require('../Models/Transaction');
const Merchant = require('../Models/Merchant');
const axios = require('axios').default;
module.exports = {
    // Initiate a payment transaction
    startPayment: async (hostURL, merchantId, { cart, amount, reference }) => {
        // Validate data
        if (!(cart instanceof Array) || cart === [] || typeof amount != "number")
            throw { httpCode: 400, message: "Bad Request" };

        // Create transaction object
        let transaction = new Transaction({
            merchantId,
            type: "Payment",
            status: "Pending",
            cart, amount, reference
        });

        // Store transaction in database
        await transaction.save();

        // Return info that the client will use to accept payment
        return {
            transactionId: transaction.id,
            checkoutURL: `${hostURL}/pay/${transaction.id}`
        };
    },

    // Get payment transaction data for use in the payment webpage
    getTransaction: async (transactionId) => {
        // Get transaction from database
        let transaction = await Transaction.findOne({ _id: transactionId, type: "Payment", status: "Pending" });
        if (!transaction)
            throw { httpCode: 404 }; // Not Found

        return transaction;
    },

    // End a payment transaction
    endPayment: async ({ transactionId, accepted, phoneNumber }) => {
        // Find and update transaction in database
        let transaction = await Transaction.findOne({ _id: transactionId, type: "Payment", status: "Pending" });
        if (!transaction)
            throw { httpCode: 404 }; // Not Found

        let merchant = await Merchant.findOne({ _id: transaction.merchantId });
        if (accepted == 'no') {
            // User cancelled the payment
            await Transaction.deleteOne({ _id: transactionId });
        }
        else {
            merchant.accountBalance += transaction.amount; // Update account balance
            await merchant.save();

            // Update transaction
            transaction.status = "Complete"
            transaction.date = new Date();
            transaction.phoneNumber = phoneNumber;
            await transaction.save();

            if (merchant.callbackURL) {
                // Send transaction data to callback url
                let data = {
                    transactionId,
                    reference: transaction.reference,
                    status: transaction.status,
                };
                axios.post(merchant.callbackURL, data).catch(() => { });
            }
        }

        // Return redirect url so the webpage can redirect
        return { redirectURL: merchant.redirectURL };
    },

    // Refund a sale
    refundSale: async (merchant, { transactionId, reason }) => {
        // Find and update transaction status
        let transaction = await Transaction.findOneAndUpdate(
            { _id: transactionId, type: "Payment", status: "Complete" },
            { $set: { status: "Refunded" } }
        );
        // If the transaction was not found, it means the transactionId is invalid
        // or the transaction status is not 'Complete'.
        if (!transaction)
            throw { httpCode: 400, message: "Invalid Transaction ID" };

        // Subtract the amount from the account balance
        merchant.accountBalance -= transaction.amount;
        await merchant.save();

        // Store record of refund
        let refund = new Transaction({
            merchantId: merchant._id,
            date: new Date,
            type: "Refund",
            referenceTransactionId: transactionId,
            phoneNumber: transaction.phoneNumber,
            refundReason: reason
        });
        await refund.save();
    },

    // Get transaction history (sorted by date in descending order i.e. latest first)
    getTransactions: (merchantId) => {
        return Transaction.find({ merchantId }).sort({ date: -1 }).lean();
    }
}
