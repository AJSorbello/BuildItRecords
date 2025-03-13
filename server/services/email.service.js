const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Admin email addresses
const ADMIN_EMAILS = ['aj@builditrecords.com', 'anmol@builditrecords.com'];

// Log SMTP settings (without password)
logger.info('Email service configuration:', {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  user: process.env.SMTP_USER,
  from: process.env.SMTP_FROM,
  hasUser: !!process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS,
  adminEmails: ADMIN_EMAILS
});

// We'll use lazy initialization of the transporter to prevent startup crashes
let transporter = null;

/**
 * Get email transporter, creating it if needed
 * @returns {nodemailer.Transporter|null}
 */
const getTransporter = () => {
  if (transporter) {
    return transporter;
  }
  
  // Don't try to create transporter if credentials are missing
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('Email transport not created - missing credentials');
    return null;
  }
  
  try {
    // Create transporter with Gmail settings
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      debug: process.env.NODE_ENV === 'development'
    });
    
    logger.info('Email transport created successfully');
    return transporter;
  } catch (error) {
    logger.error('Failed to create email transport:', error);
    return null;
  }
};

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
  // Get or create transporter
  const transport = getTransporter();
  
  // Skip if transporter could not be created
  if (!transport) {
    logger.warn('Email not sent - transporter not initialized');
    return { status: 'skipped', reason: 'Email service not configured' };
  }
  
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
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: ADMIN_EMAILS.join(', '),
      subject: `New Demo Submission - ${artistName} - ${trackTitle}`,
      text: emailContent,
    };

    const info = await transport.sendMail(mailOptions);
    logger.info('Demo submission email sent:', { messageId: info.messageId });
    return info;

  } catch (error) {
    logger.error('Failed to send demo submission email:', error);
    // Return error info but don't crash
    return { 
      status: 'error', 
      error: error.message
    };
  }
};

/**
 * Verify email configuration - but never block server startup
 * @returns {Promise<boolean>}
 */
const verifyEmailConfig = async () => {
  try {
    // Don't try to verify if credentials are missing
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('Email verification skipped - missing credentials');
      return true;
    }

    // Temporary transporter just for verification
    const verifyTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Set a timeout to prevent verification from hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Verification timeout')), 5000);
    });
    
    // Race the verification against a timeout
    await Promise.race([
      verifyTransport.verify(),
      timeoutPromise
    ]);
    
    logger.info('Email service verification successful');
    return true;
  } catch (error) {
    logger.error('Email service verification failed:', error.message);
    // Always return true to prevent server crash
    return true;
  }
};

module.exports = {
  sendDemoSubmissionEmail,
  verifyEmailConfig
};
