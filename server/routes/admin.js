/**
 * @fileoverview Admin routes for authentication and authorization
 * @module routes/admin
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * @typedef {Object} JwtUserPayload
 * @property {string} username - Username of the authenticated user
 * @property {boolean} isAdmin - Whether the user is an admin
 * @property {number} exp - Token expiration timestamp
 */

/**
 * Middleware to verify JWT token in the request header
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @throws {Error} When token verification fails
 */
const verifyToken = (req, res, next) => {
  logger.debug('verifyToken middleware:', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization
  });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('No valid authorization header');
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn('No token in authorization header');
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error('JWT_SECRET not configured');
    res.status(500).json({ message: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    logger.debug('Token verification:', { 
      username: decoded.username,
      isAdmin: decoded.isAdmin,
      exp: decoded.exp ? new Date(decoded.exp * 1000) : 'No expiration'
    });
    
    /** @type {any} */
    const req_with_user = req;
    req_with_user.user = decoded;
    next();
  } catch (err) {
    logger.error('Token verification failed:', err);
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Authenticate admin user
 *     description: Login with admin credentials to receive a JWT token
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const loginHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info('Login attempt received:', { 
      username,
      hasPassword: !!password,
      expectedUsername: process.env.ADMIN_USERNAME,
      hasExpectedPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
      headers: req.headers
    });

    if (!username || !password) {
      logger.warn('Login failed: Missing credentials');
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    if (username !== process.env.ADMIN_USERNAME) {
      logger.warn('Login failed: Invalid username');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    logger.info('Password validation:', { isValid: isValidPassword });

    if (!isValidPassword) {
      logger.warn('Login failed: Invalid password');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('Login successful:', { username });
    res.json({ 
      success: true,
      data: { token },
      message: 'Login successful' 
    });
  } catch (error) {
    logger.error('Login error:', { 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    res.status(500).json({ 
      success: false,
      message: 'Internal server error during login' 
    });
  }
};

/**
 * @swagger
 * /admin/verify-admin-token:
 *   get:
 *     summary: Verify admin token
 *     description: Verify if the provided token belongs to an admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   description: Whether the token is valid and belongs to an admin
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const verifyAdminToken = (req, res) => {
  try {
    /** @type {any} */
    const req_with_user = req;
    logger.debug('Token verification request:', {
      user: req_with_user.user,
      isAdmin: req_with_user.user?.isAdmin
    });
    
    if (!req_with_user.user || !req_with_user.user.isAdmin) {
      logger.warn('Non-admin token verification attempt');
      res.status(401).json({ verified: false, message: 'Not an admin user' });
      return;
    }
    
    logger.info('Admin token verified successfully');
    res.json({ verified: true });
  } catch (error) {
    logger.error('Error in verify-admin-token:', error);
    res.status(500).json({ verified: false, message: 'Error verifying token' });
  }
};

// Routes
router.post('/login', loginHandler);
router.get('/verify-admin-token', verifyToken, verifyAdminToken);

module.exports = router;
