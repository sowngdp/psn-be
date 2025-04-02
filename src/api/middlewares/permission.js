const { ForbiddenError } = require('../../core/error.response');

const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return next(new ForbiddenError('Bạn không có quyền truy cập'));
        }
        
        const userRoles = req.user.roles;
        const hasRequiredRole = roles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
            return next(new ForbiddenError('Bạn không có đủ quyền truy cập'));
        }
        
        next();
    };
};

module.exports = {
    hasRole
}; 