const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { DemoSubmission } = require('../models');
const emailService = require('../services/email.service.js');
const logger = require('../utils/logger');

// Validation middleware
const validateSubmission = [
  body('artist.name').trim().notEmpty().withMessage('Artist name is required'),
  body('artist.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('artist.email').isEmail().withMessage('Valid email is required'),
  body('artist.country').trim().notEmpty().withMessage('Country is required'),
  body('track.name').trim().notEmpty().withMessage('Track title is required'),
  body('track.soundCloudPrivateLink')
    .trim()
    .notEmpty()
    .withMessage('SoundCloud link is required')
    .matches(/^(https?:\/\/)?(www\.)?(soundcloud\.com|snd\.sc)\/[\w-]+\/[\w-]+$/)
    .withMessage('Invalid SoundCloud URL'),
  body('track.genre').trim().notEmpty().withMessage('Genre is required'),
];

router.post('/', validateSubmission, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { artist, track } = req.body;

    // Create demo submission with only the fields defined in our model
    const submission = await DemoSubmission.create({
      artist_name: artist.name,
      full_name: artist.fullName,
      email: artist.email,
      country: artist.country,
      province: artist.province || null,
      facebook_url: artist.facebook || null,
      twitter_url: artist.twitter || null,
      instagram_url: artist.instagram || null,
      soundcloud_url: artist.soundcloud || null,
      apple_music_url: artist.appleMusic || null,
      track_title: track.name,
      track_url: track.soundCloudPrivateLink,
      genre: track.genre
    });

    // Try to send email notification, but don't fail if it doesn't work
    try {
      const emailResult = await emailService.sendDemoSubmissionEmail({
        artistName: artist.name,
        trackTitle: track.name,
        genre: track.genre,
        soundCloudLink: track.soundCloudPrivateLink,
        email: artist.email,
        country: artist.country
      });
      
      logger.info('Email notification sent for demo submission', { 
        submissionId: submission.id,
        emailResult 
      });
    } catch (emailError) {
      // Log the error but don't fail the request
      logger.error('Failed to send email notification for demo submission', {
        error: emailError.message,
        submissionId: submission.id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Demo submitted successfully',
      data: {
        id: submission.id
      }
    });
  } catch (error) {
    logger.error('Error processing demo submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process submission. Please try again.'
    });
  }
});

module.exports = router;
