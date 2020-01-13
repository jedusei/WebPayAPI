// This represents the structure of a Merchant document in the database
const { model, Schema } = require('mongoose');

const schema = new Schema({
    name: String, // Name of Merchant
    clientSecret: String, // Client Secret used for authentication (Client ID is generated automatically by the DB driver)
    callbackURL: String, // URL to ping when a transaction is completed
    redirectURL: String, // URL to redirect to when a user completes a transaction
    accountBalance: Number // Account balance of this merchant
});

// Export the model so it can be used in other files to create, store and retrieve Merchant documents.
module.exports = model('Merchant', schema, 'merchants');