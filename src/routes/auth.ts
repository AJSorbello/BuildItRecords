import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const router = Router();
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'builditrecords',
  ssl: false
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get admin user from database
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      secret,
      { expiresIn: '24h' }
    );

    // Send success response
    res.json({
      success: true,
      data: {
        token,
        expiresIn: 86400, // 24 hours in seconds
        user: {
          id: user.id,
          username: user.username
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'No authorization header'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret);
    res.json({
      success: true,
      data: {
        verified: true,
        user: decoded
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Logout (just for clearing cookies if needed)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
