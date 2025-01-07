const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const isValidSpotifyId = (value) => {
  return typeof value === 'string' && value.length === 22;
};

module.exports = {
  validateRequest,
  isValidSpotifyId,
};
