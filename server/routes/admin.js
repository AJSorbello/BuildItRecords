const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In a real application, this should be in a database
const ADMIN_CREDENTIALS = {
    username: 'admin',
    // Password: admin123
    passwordHash: '$2a$10$Jc5D9sgXJXB5eO6.UsP/eOyvKr/bculs1R0rydRi0/K1BUEj7Qz4e'
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

// Login route
router.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (username !== ADMIN_CREDENTIALS.username) {
        console.log('Invalid username');
        return res.status(401).json({ message: "Invalid credentials" });
    }

    try {
        const validPassword = await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash);
        console.log('Password validation result:', validPassword);
        
        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { username: username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', username);
        res.json({
            token,
            username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Server error during login" });
    }
});

// Protected route example
router.get('/verify', verifyToken, (req, res) => {
    res.json({ message: "Authenticated", user: req.user });
});

module.exports = {
    router,
    verifyToken
};
