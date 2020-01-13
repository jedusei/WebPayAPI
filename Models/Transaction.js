const { model, Schema, SchemaTypes } = require('mongoose');

// Schema representing a cart item
const cartItemSchema = new Schema({
    name: String, // Product name
    quantity: Number,
    price: Number
}, { _id: false });

// This schema represents the structure of a transaction document in the database
const transactionSchema = new Schema({
    date: Date,
    type: String, // Either 'Payment' or 'Refund'
    // Properties for normal transactions *only*
    cart: { type: [cartItemSchema], default: undefined },
    amount: Number,
    reference: String,
    status: String,
    // Properties for refund transactions *only*
    referenceTransactionId: SchemaTypes.ObjectId, // The ID of the transaction associated with this refund
    refundReason: String // Reason for refund
}, { versionKey: false });

module.exports = model('Transaction', transactionSchema, 'transactions');