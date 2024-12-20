const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/environment');

const setupAuthRoutes = (app) => {
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      // Check if username matches
      if (username !== config.admin.username) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if password matches
      const isValidPassword = await bcrypt.compare(password, config.admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { username },
        config.jwt.secret,
        { expiresIn: '24h' }
      );

      res.json({ token });
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Middleware to verify JWT token
  const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Protected route example
  app.get('/api/auth/protected', verifyToken, (req, res) => {
    res.json({ message: 'Access granted', user: req.user });
  });
};

module.exports = { setupAuthRoutes };
