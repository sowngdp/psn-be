'use strict';

const { StatusCodes } = require('../utils/httpStatusCode');

/**
 * Base class for all API errors
 * @class ErrorResponse
 * @extends Error
 */
class ErrorResponse extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error raised when there's a conflict with the current state of the resource
 * @class ConflictRequestError
 * @extends ErrorResponse
 */
class ConflictRequestError extends ErrorResponse {
    constructor(message = 'Conflict Error', statusCode = StatusCodes.CONFLICT) {
        super(message, statusCode);
    }
}

/**
 * Error raised when request is invalid
 * @class BadRequestError
 * @extends ErrorResponse
 */
class BadRequestError extends ErrorResponse {
    constructor(message = 'Bad Request Error', statusCode = StatusCodes.BAD_REQUEST) {
        super(message, statusCode);
    }
}

/**
 * Error raised for authentication failures
 * @class AuthFailureError
 * @extends ErrorResponse
 */
class AuthFailureError extends ErrorResponse {
    constructor(message = 'Authentication Error', statusCode = StatusCodes.UNAUTHORIZED) {
        super(message, statusCode);
    }
}

/**
 * Error raised when resource is not found
 * @class NotFoundError
 * @extends ErrorResponse
 */
class NotFoundError extends ErrorResponse {
    constructor(message = 'Not Found Error', statusCode = StatusCodes.NOT_FOUND) {
        super(message, statusCode);
    }
}

/**
 * Error raised when user doesn't have permissions for an action
 * @class ForbiddenError
 * @extends ErrorResponse
 */
class ForbiddenError extends ErrorResponse {
    constructor(message = 'Forbidden Error', statusCode = StatusCodes.FORBIDDEN) {
        super(message, statusCode);
    }
}

/**
 * Error raised for server-side issues
 * @class InternalServerError
 * @extends ErrorResponse
 */
class InternalServerError extends ErrorResponse {
    constructor(message = 'Internal Server Error', statusCode = StatusCodes.INTERNAL_SERVER_ERROR) {
        super(message, statusCode);
    }
}

/**
 * Error for requests that would cause a business rule violation
 * @class BusinessRuleViolationError
 * @extends ErrorResponse
 */
class BusinessRuleViolationError extends ErrorResponse {
    constructor(message = 'Business Rule Violation', statusCode = StatusCodes.UNPROCESSABLE_ENTITY) {
        super(message, statusCode);
    }
}

/**
 * Error for requests that exceed rate limits
 * @class TooManyRequestsError
 * @extends ErrorResponse
 */
class TooManyRequestsError extends ErrorResponse {
    constructor(message = 'Too Many Requests', statusCode = StatusCodes.TOO_MANY_REQUESTS) {
        super(message, statusCode);
    }
}

/**
 * Error for requests with unsupported media types
 * @class UnsupportedMediaTypeError
 * @extends ErrorResponse
 */
class UnsupportedMediaTypeError extends ErrorResponse {
    constructor(message = 'Unsupported Media Type', statusCode = StatusCodes.UNSUPPORTED_MEDIA_TYPE) {
        super(message, statusCode);
    }
}

/**
 * Error for validation failures
 * @class ValidationError
 * @extends ErrorResponse
 */
class ValidationError extends ErrorResponse {
    constructor(message = 'Validation Error', statusCode = StatusCodes.BAD_REQUEST, errors = []) {
        super(message, statusCode);
        this.errors = errors;
    }
}

/**
 * Error for service unavailability (like external services being down)
 * @class ServiceUnavailableError
 * @extends ErrorResponse
 */
class ServiceUnavailableError extends ErrorResponse {
    constructor(message = 'Service Unavailable', statusCode = StatusCodes.SERVICE_UNAVAILABLE) {
        super(message, statusCode);
    }
}

module.exports = {
    ErrorResponse,
    ConflictRequestError,
    BadRequestError,
    AuthFailureError,
    NotFoundError,
    ForbiddenError,
    InternalServerError,
    BusinessRuleViolationError,
    TooManyRequestsError,
    UnsupportedMediaTypeError,
    ValidationError,
    ServiceUnavailableError
};
