'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, assistant, system]
 *           description: Role of the message sender
 *         content:
 *           type: string
 *           description: Content of the message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Time when the message was sent
 *       required:
 *         - role
 *         - content
 *
 *     ChatMetadata:
 *       type: object
 *       properties:
 *         lastInteraction:
 *           type: string
 *           format: date-time
 *           description: Time of last interaction in the chat
 *         messageCount:
 *           type: number
 *           description: Total number of messages in the chat
 *
 *     Chat:
 *       type: object
 *       properties:
 *         chatId:
 *           type: string
 *           description: Unique identifier of the chat
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *           description: Array of chat messages
 *         metadata:
 *           $ref: '#/components/schemas/ChatMetadata'
 *           description: Chat metadata
 *
 *     SendMessageRequest:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Message to send
 *         chatId:
 *           type: string
 *           description: Optional chat ID to continue conversation
 *       required:
 *         - message
 *
 *     SendMessageResponse:
 *       type: object
 *       properties:
 *         chatId:
 *           type: string
 *           description: ID of the chat
 *         message:
 *           type: string
 *           description: AI response message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Time when the response was generated
 *
 *     ChatHistoryResponse:
 *       type: object
 *       properties:
 *         chats:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Chat'
 *           description: Array of chat histories
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *         message:
 *           type: string
 *           description: Success message
 */

module.exports = {};
