const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const helmet = require('helmet');

const app = express();

// Configure Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'"],
        formAction: ["'self'"]
      },
    },
  })
);

// Parse JSON bodies
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email submission endpoint
app.post('/api/submit-demo', async (req, res) => {
  try {
    const { artist, track } = req.body;

    const emailContent = `
      New Demo Submission

      Artist Information:
      Full Name: ${artist.fullName}
      Artist Name: ${artist.name}
      Email: ${artist.email}
      Country: ${artist.country}
      Province/State: ${artist.province}

      Social Media:
      Facebook: ${artist.facebook}
      Twitter: ${artist.twitter}
      Instagram: ${artist.instagram}
      SoundCloud: ${artist.soundcloud}
      Spotify: ${artist.spotify}
      Apple Music: ${artist.appleMusic}

      Track Information:
      Title: ${track.title}
      Genre: ${track.genre}
      SoundCloud Link: ${track.soundCloudPrivateLink}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'aj@builditrecords.com',
      subject: `Demo Submission: ${artist.name} - ${track.genre}`,
      text: emailContent
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
