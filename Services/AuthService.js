const Merchant = require('../Models/Merchant');
const InvalidCredentialsError = { httpCode: 400, message: "Invalid Credentials" };
const jwt = require('jsonwebtoken');
const config = require('../config');
module.exports = {
    // Get an access token to use with the other API routes
    getToken: async (clientId, clientSecret) => {
        // Check if both parameters are not empty
        if (!clientId || !clientSecret)
            throw InvalidCredentialsError;

        // Find merchant
        const merchant = await Merchant.findById(clientId);
        if (!merchant) {
            // Merchant not found; this means the clientId given is invalid.
            throw InvalidCredentialsError;
        }

        // Create and return an access token that expires in an hour
        return {
            bestBefore: Date.now() + 3600000,
            token: jwt.sign({ clientId }, config['jwt_key'], { expiresIn: 3600 })
        };
    },
    // Verify the bearer token used in the request
    verifyToken: async (req, res, next) => {
        try {
            // Header is in the form "Bearer <token>"
            let token = req.headers['authorization'].substring(7);
            let tokenData = jwt.verify(token, config['jwt_key'], { ignoreExpiration: true });
            let merchant = await Merchant.findById(tokenData.clientId);
            if (!merchant) {
                // Merchant not found; this means the client ID stored in the token is invalid.
                res.sendStatus(401); // Unauthorized
                return;
            }

            // Set this property so we can use it in the next middleware
            req.merchant = merchant;
            next();
        }
        catch (err) {
            res.sendStatus(401); // Unauthorized
        }
    }
}