'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID tự động tạo của MongoDB
 *         email:
 *           type: string
 *           format: email
 *           description: Email người dùng
 *         password:
 *           type: string
 *           format: password
 *           description: Mật khẩu đã được mã hóa
 *         name:
 *           type: string
 *           description: Tên người dùng
 *         avatar:
 *           type: string
 *           description: URL ảnh đại diện
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Item:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - ownerId
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *           enum: [top, bottom, dress, outerwear, shoes, accessories]
 *         color:
 *           type: string
 *         brand:
 *           type: string
 *         season:
 *           type: string
 *           enum: [spring, summer, fall, winter, all]
 *         occasion:
 *           type: array
 *           items:
 *             type: string
 *         imageUrl:
 *           type: string
 *         inCloset:
 *           type: boolean
 *           default: true
 *         wearCount:
 *           type: number
 *           default: 0
 *         ownerId:
 *           type: string
 *
 *     Outfit:
 *       type: object
 *       required:
 *         - name
 *         - items
 *         - ownerId
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *               position:
 *                 type: string
 *         season:
 *           type: string
 *           enum: [spring, summer, fall, winter, all]
 *         occasion:
 *           type: array
 *           items:
 *             type: string
 *         styleScore:
 *           type: number
 *         lastWorn:
 *           type: string
 *           format: date-time
 *         ownerId:
 *           type: string
 *
 *     Recommendation:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [daily, event, weather, season, style]
 *         context:
 *           type: object
 *         status:
 *           type: string
 *           enum: [pending, completed]
 *         recommendedOutfits:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               outfitId:
 *                 type: string
 *               score:
 *                 type: number
 *               reason:
 *                 type: string
 *         feedback:
 *           type: object
 *           properties:
 *             rating:
 *               type: number
 *             comment:
 *               type: string
 *             selectedOutfitId:
 *               type: string
 *             createdAt:
 *               type: string
 *               format: date-time
 *
 *     StyleRule:
 *       type: object
 *       required:
 *         - name
 *         - ruleType
 *         - conditions
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         ruleType:
 *           type: string
 *           enum: [color_combination, pattern_matching, proportion, occasion, body_type, season, general]
 *         conditions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               attribute:
 *                 type: string
 *               operator:
 *                 type: string
 *               value:
 *                 type: object
 *         score:
 *           type: number
 *         isActive:
 *           type: boolean
 *         isPublic:
 *           type: boolean
 *         createdBy:
 *           type: string
 */ 
