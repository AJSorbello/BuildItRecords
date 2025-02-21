const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Admin email addresses
const ADMIN_EMAILS = ['aj@builditrecords.com', 'anmol@builditrecords.com'];

// Log SMTP settings (without password)
logger.info('Email service configuration:', {
  host: 'smtp.gmail.com',
  port: 587,
  user: process.env.SMTP_USER,
  from: process.env.SMTP_FROM,
  hasUser: !!process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS,
  adminEmails: ADMIN_EMAILS
});

// Create transporter with Gmail settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // This should be your Gmail App Password
  },
  logger: true,
  debug: true // Enable debug logging
});

/**
 * @typedef {Object} DemoSubmission
 * @property {string} artistName
 * @property {string} trackTitle
 * @property {string} genre
 * @property {string} soundCloudLink
 * @property {string} email
 * @property {string} country
 */

/**
 * Send email notification for a new demo submission
 * @param {DemoSubmission} submission
 * @returns {Promise<any>}
 */
const sendDemoSubmissionEmail = async (submission) => {
  try {
    const { artistName, trackTitle, genre, soundCloudLink, email, country } = submission;

    const emailContent = `
      New Demo Submission

      Artist Information:
      ------------------
      Artist Name: ${artistName}
      Email: ${email}
      Country: ${country}

      Track Information:
      -----------------
      Title: ${trackTitle}
      Genre: ${genre}
      SoundCloud Link: ${soundCloudLink}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: ADMIN_EMAILS.join(', '),
      subject: `New Demo Submission - ${artistName} - ${trackTitle}`,
      text: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Demo submission email sent:', { messageId: info.messageId });
    return info;

  } catch (error) {
    logger.error('Failed to send demo submission email:', error);
    throw error;
  }
};

// Verify email configuration on startup
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    logger.info('Email service is ready');
    return true;
  } catch (error) {
    logger.error('Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendDemoSubmissionEmail,
  verifyEmailConfig
};
