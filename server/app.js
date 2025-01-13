const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pool } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/labels', require('./routes/labels'));
app.use('/api/artists', require('./routes/artists'));
app.use('/api/releases', require('./routes/releases'));
app.use('/api/tracks', require('./routes/tracks'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
