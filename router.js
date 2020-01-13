const AuthService = require('./Services/AuthService');
const TransactionService = require('./Services/TransactionService');
const express = require('express');
const router = express.Router();

// Get Access Token
router.get('/api/token', async (req, res, next) => {
    try {
        let token = await AuthService.getToken(req.headers['wp-client-id'], req.headers['wp-client-secret']);
        res.send(token);
    }
    catch (err) {
        next(err); // Pass error on to error handler
    }
});

// Initiate a payment transaction
router.post('/api/start-payment', AuthService.verifyToken, async (req, res, next) => {
    try {
        let hostURL = `${req.protocol}://${req.get('host')}`;
        let result = await TransactionService.startPayment(req.merchant._id, hostURL, req.body);
        res.send(result);
    }
    catch (err) {
        next(err); // Pass error on to error handler
    }
});

// Payment webpage
router.get('/pay/:transactionId', async (req, res, next) => {
    try {
        let data = await TransactionService.getTransaction(req.params.transactionId);
        res.render('../public/pages/checkout', data);
    }
    catch (err) {
        next(err); // Pass error on to error handler
    }
});

// End a transaction (not for public use)
router.post('/api/end-payment', async (req, res, next) => {
    try {
        let result = await TransactionService.endPayment(req.body);
        res.send(result);
    }
    catch (err) {
        next(err); // Pass error on to error handler
    }
});

// Get Account Balance
router.get('/api/balance', AuthService.verifyToken, (req, res) => {
    res.send({ balance: req.merchant.accountBalance });
});

// Refund a sale
router.post('/api/refund', AuthService.verifyToken, async (req, res, next) => {
    try {
        await TransactionService.refundSale(req.merchant, req.body);
        res.status(200).send();
    }
    catch (err) {
        next(err); // Pass error on to error handler
    }
});

// Get transaction history
router.get('/api/transactions', AuthService.verifyToken, async (req, res, next) => {
    try {
        let transactions = await TransactionService.getTransactions(req.merchant._id);
        res.send(transactions);
    }
    catch (err) {
        next(err); // Pass error on to error handler
    }
});

module.exports = router;