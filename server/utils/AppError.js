/**
 * Custom error class for application errors
 * @extends Error
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client
   * @param {Error} [originalError] - Original error that caused this error
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', originalError = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.originalError = originalError;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get error details for response
   * @returns {Object} Error details
   */
  toJSON() {
    return {
      message: this.message,
      code: this.code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        originalError: this.originalError?.message
      })
    };
  }
}

module.exports = AppError;
