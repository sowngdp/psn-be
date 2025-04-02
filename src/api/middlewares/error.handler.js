const { ValidationError } = require('joi');
const { AuthFailureError, BadRequestError, ForbiddenError, NotFoundError } = require('../../core/error.response');

const errorHandler = (err, req, res, next) => {
    console.error('ERROR HANDLER::', err);
    
    // Phân loại lỗi và trả về response phù hợp
    if (err instanceof ValidationError) {
        return res.status(400).json({
            status: 'error',
            code: 'BAD_REQUEST',
            message: err.message
        });
    }
    
    if (err instanceof AuthFailureError) {
        return res.status(401).json({
            status: 'error',
            code: 'UNAUTHORIZED',
            message: err.message
        });
    }
    
    if (err instanceof ForbiddenError) {
        return res.status(403).json({
            status: 'error',
            code: 'FORBIDDEN',
            message: err.message
        });
    }
    
    if (err instanceof NotFoundError) {
        return res.status(404).json({
            status: 'error',
            code: 'NOT_FOUND',
            message: err.message
        });
    }
    
    if (err instanceof BadRequestError) {
        return res.status(400).json({
            status: 'error',
            code: 'BAD_REQUEST',
            message: err.message
        });
    }
    
    // Lỗi mặc định
    return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi phía máy chủ'
    });
};

module.exports = errorHandler; 