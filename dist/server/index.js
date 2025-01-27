"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Load environment variables first
require('dotenv').config();
// Debug: Log environment loading
console.log('Server starting with environment:', process.env.NODE_ENV);
console.log('Admin credentials loaded:', {
    hasUsername: !!process.env.ADMIN_USERNAME,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    hasJwtSecret: !!process.env.JWT_SECRET
});
console.log('Spotify credentials loaded:', {
    hasClientId: !!process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    hasClientSecret: !!process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
    hasRedirectUri: !!process.env.REACT_APP_SPOTIFY_REDIRECT_URI
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Sequelize } = require('sequelize');
const apiRoutes = require('./routes/api.routes');
const app = express();
const PORT = process.env.PORT || 3001;
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
// Configure CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Routes
app.use('/api', apiRoutes);
// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create Sequelize instance
        const sequelize = new Sequelize(process.env.DB_NAME || 'builditrecords', process.env.DB_USERNAME || 'postgres', process.env.DB_PASSWORD || 'postgres', {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: false
        });
        // Test database connection
        yield sequelize.authenticate();
        console.log('Database connection established successfully');
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
});
startServer();
