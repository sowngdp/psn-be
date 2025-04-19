const { ValidationError: JoiValidationError } = require('joi');
const { 
    AuthFailureError, 
    BadRequestError, 
    ForbiddenError, 
    NotFoundError,
    ConflictRequestError,
    BusinessRuleViolationError,
    TooManyRequestsError,
    UnsupportedMediaTypeError,
    ValidationError,
    ServiceUnavailableError,
    InternalServerError
} = require('../../core/error.response');
const logger = require('../../utils/logger');
const { ReasonPhrases, StatusCodes } = require('../../utils/httpStatusCode');

/**
 * Unified error handler middleware for consistent error responses
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object} - JSON response with error details
 */
const errorHandler = (err, req, res, next) => {
    // Generate a unique error ID for tracking
    const errorId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    
    // Log error with error ID for correlation
    logger.error(`[${errorId}] Error processing request`, {
        errorId,
        path: req.path,
        method: req.method,
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        body: process.env.NODE_ENV !== 'production' ? req.body : undefined
    });
    
    // Create standardized error response format
    const errorResponse = {
        status: 'error',
        errorId,
        code: undefined,
        message: undefined,
        details: undefined
    };

    // Handle different error types
    if (err instanceof JoiValidationError) {
        errorResponse.code = ReasonPhrases.BAD_REQUEST;
        errorResponse.message = 'Validation Error';
        errorResponse.details = err.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
    }
    
    if (err instanceof ValidationError) {
        errorResponse.code = ReasonPhrases.BAD_REQUEST;
        errorResponse.message = err.message;
        errorResponse.details = err.errors;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof AuthFailureError) {
        errorResponse.code = ReasonPhrases.UNAUTHORIZED;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof ForbiddenError) {
        errorResponse.code = ReasonPhrases.FORBIDDEN;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof NotFoundError) {
        errorResponse.code = ReasonPhrases.NOT_FOUND;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof BadRequestError) {
        errorResponse.code = ReasonPhrases.BAD_REQUEST;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof ConflictRequestError) {
        errorResponse.code = ReasonPhrases.CONFLICT;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof BusinessRuleViolationError) {
        errorResponse.code = ReasonPhrases.UNPROCESSABLE_ENTITY;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof TooManyRequestsError) {
        errorResponse.code = ReasonPhrases.TOO_MANY_REQUESTS;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof UnsupportedMediaTypeError) {
        errorResponse.code = ReasonPhrases.UNSUPPORTED_MEDIA_TYPE;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    if (err instanceof ServiceUnavailableError) {
        errorResponse.code = ReasonPhrases.SERVICE_UNAVAILABLE;
        errorResponse.message = err.message;
        return res.status(err.status).json(errorResponse);
    }
    
    // Handle any other error as Internal Server Error
    errorResponse.code = ReasonPhrases.INTERNAL_SERVER_ERROR;
    errorResponse.message = process.env.NODE_ENV === 'production' 
        ? 'Đã xảy ra lỗi phía máy chủ' 
        : err.message || 'Đã xảy ra lỗi phía máy chủ';
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
};

module.exports = errorHandler; 