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
// Add environment check logging
console.log('Environment Check:', {
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
});
// Debug: Log environment loading
console.log('Server starting with environment:', process.env.NODE_ENV);
console.log('Admin credentials loaded:', {
    hasUsername: !!process.env.ADMIN_USERNAME,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    hasJwtSecret: !!process.env.JWT_SECRET,
    actualHash: process.env.ADMIN_PASSWORD_HASH
});
// Debug: Log Spotify config
console.log('Spotify config loaded:', {
    hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});
// Debug: Log all env variables
console.log('Environment variables loaded:', {
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    JWT_SECRET: process.env.JWT_SECRET,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? '✓' : '✗',
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? '✓' : '✗',
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./models');
const SpotifyService = require('./services/spotifyService');
const apiRoutes = require('./routes/api.routes');
const { seedLabels } = require('./seeders/labelSeeder');
const { initializeDatabase } = require('../src/config/database');
const app = express();
// Initialize services
const initServices = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield initializeDatabase().catch(err => {
            console.error('Failed to initialize database:', err);
            process.exit(1);
        });
        console.log('Database connection established successfully');
        // Initialize database with labels if in development
        if (process.env.NODE_ENV === 'development') {
            try {
                yield db.sequelize.sync({ force: true });
                console.log('Database synced successfully');
                yield seedLabels();
                console.log('Labels seeded successfully');
            }
            catch (error) {
                console.error('Error syncing/seeding database:', error);
            }
        }
        // Initialize Spotify service
        const spotifyService = new SpotifyService(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, process.env.SPOTIFY_REDIRECT_URI);
        yield spotifyService.initialize();
        console.log('Spotify service initialized successfully');
        return { spotifyService, db, sequelize: db.sequelize };
    }
    catch (error) {
        console.error('Failed to initialize services:', error);
        throw error;
    }
});
// Initialize Express routes and middleware
const initExpress = (spotifyService, db, sequelize) => {
    // CORS configuration - must be before other middleware
    app.use(cors({
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        exposedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
        preflightContinue: false,
        optionsSuccessStatus: 204
    }));
    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));
    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // API routes
    app.use('/api', apiRoutes);
    // Debug route to check environment
    app.get('/api/debug/env', (req, res) => {
        res.json({
            nodeEnv: process.env.NODE_ENV,
            hasSpotifyConfig: {
                clientId: !!process.env.SPOTIFY_CLIENT_ID,
                clientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
                redirectUri: process.env.SPOTIFY_REDIRECT_URI
            },
            hasAdminConfig: {
                username: !!process.env.ADMIN_USERNAME,
                passwordHash: !!process.env.ADMIN_PASSWORD_HASH,
                jwtSecret: !!process.env.JWT_SECRET
            }
        });
    });
    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../build')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../build/index.html'));
        });
    }
    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(err.status || 500).json(Object.assign({ message: err.message || 'Internal server error' }, (process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})));
    });
};
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { spotifyService, db, sequelize } = yield initServices();
        initExpress(spotifyService, db, sequelize);
        const port = process.env.PORT || 3001;
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
