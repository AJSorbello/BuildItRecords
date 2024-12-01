const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

const isValidSpotifyId = (id) => {
    return typeof id === 'string' && id.length === 22;
};

module.exports = {
    validateRequest,
    isValidSpotifyId
};
