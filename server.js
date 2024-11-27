const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();

// Configure Helmet CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.emailjs.com",
        "http://localhost:3000",
        "ws://localhost:3000"
      ],
      connectSrc: [
        "'self'",
        "https://api.emailjs.com",
        "http://localhost:3000",
        "ws://localhost:3000",
        "ws://localhost:*",
        "http://localhost:*"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'"],
      formAction: ["'self'"]
    },
  })
);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
