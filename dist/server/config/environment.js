"use strict";
const path = require('path');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config();
const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME || 'builditrecords',
        dialect: 'postgres'
    },
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
        playlists: {
            'buildit-records': process.env.SPOTIFY_BUILDIT_RECORDS_PLAYLIST_ID,
            'buildit-tech': process.env.SPOTIFY_BUILDIT_TECH_PLAYLIST_ID,
            'buildit-deep': process.env.SPOTIFY_BUILDIT_DEEP_PLAYLIST_ID
        }
    },
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        passwordHash: process.env.ADMIN_PASSWORD_HASH
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'development-secret'
    }
};
// Validate required configuration
const validateConfig = (config) => {
    const requiredFields = {
        'database.host': config.database.host,
        'database.name': config.database.name,
        'database.password': config.database.password,
        'spotify.clientId': config.spotify.clientId,
        'spotify.clientSecret': config.spotify.clientSecret
    };
    const missing = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
};
// Validate configuration before exporting
validateConfig(config);
module.exports = config;
