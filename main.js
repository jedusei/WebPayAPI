// Initialize and configure server application
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use('/images', express.static('public/images'))
app.use(require('./router'));
app.use((err, req, res, next) => {
    if (err.httpCode)
        res.status(err.httpCode).send(err.message);
    else {
        console.error(err);
        res.status(500).send(); // Internal Server Error
    }
});

// Connect to MongoDB database
const mongoose = require('mongoose');
const config = require('./config');
mongoose.connect(config["database_url"], { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
        // Start server application
        app.listen(process.env.PORT || 1234, () => {
            console.log("Server application is up and running.");
        });
    })
    .catch((err) => {
        // If an error occurs, log it and exit.
        console.error(err);
        console.error("An error occurred while trying to connect to MongoDB. Exiting...");
        process.exit(1);
    });