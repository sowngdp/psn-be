'use strict';

// Định nghĩa các mã lỗi HTTP
const HttpStatusCode = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER: 500
};

class ErrorResponse extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = 'Conflict Error', statusCode = HttpStatusCode.CONFLICT) {
        super(message, statusCode);
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = 'Bad Request Error', statusCode = HttpStatusCode.BAD_REQUEST) {
        super(message, statusCode);
    }
}

class AuthFailureError extends ErrorResponse {
    constructor(message = 'Authentication Error', statusCode = HttpStatusCode.UNAUTHORIZED) {
        super(message, statusCode);
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = 'Not Found Error', statusCode = HttpStatusCode.NOT_FOUND) {
        super(message, statusCode);
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = 'Forbidden Error', statusCode = HttpStatusCode.FORBIDDEN) {
        super(message, statusCode);
    }
}

class InternalServerError extends ErrorResponse {
    constructor(message = 'Internal Server Error', statusCode = HttpStatusCode.INTERNAL_SERVER) {
        super(message, statusCode);
    }
}

module.exports = {
    ConflictRequestError,
    BadRequestError,
    AuthFailureError,
    NotFoundError,
    ForbiddenError,
    InternalServerError
};
