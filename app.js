const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Mount routes
app.use('/', routes);

module.exports = app;
