'use strict';

/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: Không được ủy quyền - token không hợp lệ hoặc hết hạn
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               code:
 *                 type: integer
 *                 example: 401
 *               message:
 *                 type: string
 *                 example: Unauthorized
 *
 *     NotFoundError:
 *       description: Không tìm thấy tài nguyên yêu cầu
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               code:
 *                 type: integer
 *                 example: 404
 *               message:
 *                 type: string
 *                 example: Resource not found
 *
 *     ValidationError:
 *       description: Dữ liệu đầu vào không hợp lệ
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               code:
 *                 type: integer
 *                 example: 400
 *               message:
 *                 type: string
 *                 example: Validation failed
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 *
 *     ServerError:
 *       description: Lỗi server
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               code:
 *                 type: integer
 *                 example: 500
 *               message:
 *                 type: string
 *                 example: Internal server error
 */ 
