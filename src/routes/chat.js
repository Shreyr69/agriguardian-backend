const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// All chat routes require authentication
router.use(authMiddleware);

// Conversation management
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getUserConversations);
router.get('/conversations/:id', validateMongoId('id'), validate, chatController.getConversation);
router.patch('/conversations/:id', validateMongoId('id'), validate, chatController.updateConversation);
router.delete('/conversations/:id', validateMongoId('id'), validate, chatController.deleteConversation);

// Message management
router.post('/conversations/:conversation_id/messages', validateMongoId('conversation_id'), validate, chatController.saveMessage);

module.exports = router;
