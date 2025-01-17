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
const express = require('express');
const router = express.Router();
const { ImportLog, Label } = require('../models');
const SpotifyService = require('../services/spotifyService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
require('dotenv').config(); // Make sure we load environment variables
// Initialize SpotifyService
const spotifyService = new SpotifyService(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, process.env.SPOTIFY_REDIRECT_URI);
// Debug: Log environment variables
console.log('Admin credentials loaded:', {
    hasUsername: !!process.env.ADMIN_USERNAME,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecret: process.env.JWT_SECRET // Log the actual secret for debugging
});
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    var _a;
    console.log('verifyToken middleware:', {
        path: req.path,
        method: req.method,
        headers: req.headers,
        token: req.headers.authorization ? 'present' : 'missing'
    });
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verification:', {
                username: decoded.username,
                isAdmin: decoded.isAdmin,
                exp: new Date(decoded.exp * 1000)
            });
            req.user = decoded;
            next();
        }
        catch (err) {
            console.error('Token verification failed:', err);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
    }
    catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ message: 'Error verifying token' });
    }
};
// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});
// Verify admin token
router.get('/verify-admin', verifyToken, (req, res) => {
    res.json({ message: 'Token is valid', user: req.user });
});
// Verify admin token endpoint
router.get('/verify-admin-token', verifyToken, (req, res) => {
    var _a;
    try {
        console.log('Token verification request:', {
            user: req.user,
            isAdmin: (_a = req.user) === null || _a === void 0 ? void 0 : _a.isAdmin
        });
        if (!req.user || !req.user.isAdmin) {
            return res.status(401).json({ verified: false, message: 'Not an admin user' });
        }
        res.json({ verified: true });
    }
    catch (error) {
        console.error('Error in verify-admin-token:', error);
        res.status(500).json({ verified: false, message: 'Error verifying token' });
    }
});
// Admin login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', {
            username,
            expectedUsername: process.env.ADMIN_USERNAME,
            hasPassword: !!password,
            hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
            jwtSecret: process.env.JWT_SECRET // Log JWT secret for debugging
        });
        // Verify username
        if (!username || username !== process.env.ADMIN_USERNAME) {
            console.log('Username mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Verify password
        if (!password || !process.env.ADMIN_PASSWORD_HASH) {
            console.error('Missing password or hash');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isValidPassword = yield bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        if (!isValidPassword) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jwt.sign({
            username: process.env.ADMIN_USERNAME,
            isAdmin: true // Add isAdmin flag
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // Log token details
        const decoded = jwt.decode(token);
        console.log('Generated token details:', {
            token: token.substring(0, 20) + '...',
            decoded,
            expiresIn: '24h'
        });
        res.json({
            token,
            username: process.env.ADMIN_USERNAME,
            expiresIn: '24h'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}));
// Import releases for a label
router.get('/import-releases/:labelId', verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let importLog = null;
    try {
        const { labelId } = req.params;
        console.log('Starting import for label:', labelId);
        // Find the label by ID or slug
        const label = yield Label.findOne({
            where: {
                [Op.or]: [
                    { id: labelId },
                    { slug: labelId }
                ]
            }
        });
        if (!label) {
            console.log('Label not found:', labelId);
            return res.status(404).json({
                success: false,
                error: 'Label not found',
                details: `No label found with ID or slug: ${labelId}`
            });
        }
        console.log('Found label:', label.toJSON());
        // Create import log
        try {
            importLog = yield ImportLog.create({
                label_id: label.id,
                status: 'started',
                message: `Starting import for ${label.name}`,
                completed_at: null
            });
            console.log('Created import log:', importLog.toJSON());
        }
        catch (error) {
            console.error('Error creating import log:', error);
            throw error;
        }
        // Initialize Spotify service if needed
        if (!spotifyService.isInitialized()) {
            console.log('Initializing Spotify service...');
            try {
                yield spotifyService.initialize();
                console.log('Spotify service initialized successfully');
            }
            catch (error) {
                console.error('Failed to initialize Spotify service:', error);
                yield importLog.update({
                    status: 'failed',
                    message: 'Failed to initialize Spotify service: ' + error.message,
                    completed_at: new Date()
                });
                return res.status(500).json({
                    success: false,
                    error: 'Failed to initialize Spotify service',
                    details: error.message
                });
            }
        }
        // Search for releases
        console.log('Searching for releases from label:', label.display_name);
        let albums;
        try {
            albums = yield spotifyService.searchAlbumsByLabel(label.display_name);
            console.log('Found releases:', albums ? albums.length : 0);
        }
        catch (error) {
            console.error('Error searching for albums:', error);
            yield importLog.update({
                status: 'failed',
                message: 'Error searching for albums: ' + error.message,
                completed_at: new Date()
            });
            throw error;
        }
        if (!albums || albums.length === 0) {
            yield importLog.update({
                status: 'completed',
                message: `No releases found on Spotify for ${label.name}. This is expected for new labels.`,
                completed_at: new Date()
            });
            return res.json({
                success: true,
                message: `No releases found on Spotify for ${label.name}. This is expected for new labels.`,
                releases: []
            });
        }
        // Import releases
        console.log('Importing releases for label:', label.name);
        let importedReleases;
        try {
            importedReleases = yield spotifyService.importReleases(label, albums);
            console.log('Successfully imported releases:', importedReleases.length);
        }
        catch (error) {
            console.error('Error importing releases:', error);
            yield importLog.update({
                status: 'failed',
                message: 'Error importing releases: ' + error.message,
                completed_at: new Date()
            });
            throw error;
        }
        // Update import log
        yield importLog.update({
            status: 'completed',
            message: `Successfully imported ${importedReleases.length} releases`,
            completed_at: new Date()
        });
        res.json({
            success: true,
            message: `Successfully imported ${importedReleases.length} releases`,
            releases: importedReleases
        });
    }
    catch (error) {
        console.error('Import error:', error);
        if (importLog) {
            yield importLog.update({
                status: 'failed',
                message: error.message,
                completed_at: new Date()
            }).catch(err => {
                console.error('Error updating import log:', err);
            });
        }
        res.status(500).json({
            success: false,
            error: 'Import failed',
            details: error.message
        });
    }
}));
module.exports = {
    router,
    verifyToken
};
