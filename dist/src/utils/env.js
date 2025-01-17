"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.SPOTIFY_CONFIG = exports.getOptionalEnvVar = exports.getRequiredEnvVar = void 0;
const getRequiredEnvVar = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is not defined`);
    }
    return value;
};
exports.getRequiredEnvVar = getRequiredEnvVar;
const getOptionalEnvVar = (key, defaultValue = '') => {
    return process.env[key] || defaultValue;
};
exports.getOptionalEnvVar = getOptionalEnvVar;
// Required Spotify configuration
exports.SPOTIFY_CONFIG = {
    CLIENT_ID: (0, exports.getRequiredEnvVar)('REACT_APP_SPOTIFY_CLIENT_ID'),
    CLIENT_SECRET: (0, exports.getRequiredEnvVar)('REACT_APP_SPOTIFY_CLIENT_SECRET'),
    REDIRECT_URI: (0, exports.getRequiredEnvVar)('REACT_APP_SPOTIFY_REDIRECT_URI'),
};
// Environment helpers
exports.isDevelopment = process.env.NODE_ENV === 'development';
exports.isProduction = process.env.NODE_ENV === 'production';
exports.isTest = process.env.NODE_ENV === 'test';
