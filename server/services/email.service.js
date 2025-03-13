const logger = require('../utils/logger');

// Admin email addresses
const ADMIN_EMAILS = ['aj@builditrecords.com', 'anmol@builditrecords.com'];

// Log that email is disabled
logger.warn('Email service is DISABLED in this deployment');

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
 * Mock implementation that just logs but doesn't send emails
 * @param {DemoSubmission} submission
 * @returns {Promise<any>}
 */
const sendDemoSubmissionEmail = async (submission) => {
  try {
    const { artistName, trackTitle, genre, soundCloudLink, email, country } = submission;
    
    logger.info('Demo submission received (email not sent):', {
      artistName,
      trackTitle,
      genre,
      email,
      country
    });
    
    return { 
      status: 'skipped', 
      reason: 'Email service disabled',
      messageId: `mock-${Date.now()}`
    };
  } catch (error) {
    logger.error('Error in mock email service:', error);
    return { 
      status: 'error', 
      reason: error.message
    };
  }
};

/**
 * Mock verification function that always returns true
 * @returns {Promise<boolean>}
 */
const verifyEmailConfig = async () => {
  logger.info('Email verification skipped - service is disabled');
  return true;
};

module.exports = {
  sendDemoSubmissionEmail,
  verifyEmailConfig
};
