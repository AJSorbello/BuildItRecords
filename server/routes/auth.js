const express = require('express');
const authRouter = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { AdminUser } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info(`Login attempt for username: ${username}`);

    const user = await AdminUser.findOne({ 
      where: { username },
      raw: false // Ensure we get a model instance
    });
    
    if (!user) {
      logger.info(`No user found for username: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Use validPassword method
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      logger.info(`Invalid password for username: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Login successful for username: ${username}`);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

// Verify token endpoint
authRouter.get('/verify-token', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    logger.info('No token provided for verification');
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await AdminUser.findByPk(decoded.id);
    
    if (!user) {
      logger.warn('Token valid but user not found:', decoded);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('Token verified successfully for user:', decoded.username);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = authRouter;
