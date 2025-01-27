"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONFIG = exports.SPOTIFY_CONFIG = void 0;
exports.SPOTIFY_CONFIG = {
    CLIENT_ID: process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
    CLIENT_SECRET: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.REACT_APP_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback',
};
exports.API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001'
};
