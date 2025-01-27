/**
 * @fileoverview Authentication middleware
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * @typedef {Object} JwtUserPayload
 * @property {string} username - Username of the authenticated user
 * @property {boolean} isAdmin - Whether the user is an admin
 * @property {number} exp - Token expiration timestamp
 */

/**
 * Middleware to verify JWT token
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    /** @type {JwtUserPayload} */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'Token expired' });
    }

    // Check if user is admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  verifyToken
};
