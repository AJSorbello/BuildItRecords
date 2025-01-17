"use strict";
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { logger } = require('../src/utils/logger');
const { pool } = require('./utils/db');
require('dotenv').config();
const app = express();
// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
// Log all requests
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body
    });
    next();
});
// Import and mount API routes
const apiRoutes = require('./routes/api.routes');
app.use('/api', apiRoutes);
// Log registered routes
logger.info('Registered routes:');
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        logger.info(`${Object.keys(middleware.route.methods).join(',')} ${middleware.route.path}`);
    }
    else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                logger.info(`${Object.keys(handler.route.methods).join(',')} ${handler.route.path}`);
            }
        });
    }
});
// Catch-all route for debugging
app.use('*', (req, res) => {
    logger.warn('404 Not Found:', {
        method: req.method,
        url: req.url
    });
    res.status(404).json({ error: 'Not found', path: req.originalUrl });
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ error: err.message });
});
const port = process.env.PORT || 3001;
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
module.exports = app;
