const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// All chat routes require authentication
router.use(authMiddleware);

// Conversation management
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getUserConversations);
router.get('/conversations/:id', chatController.getConversation);
router.patch('/conversations/:id', chatController.updateConversation);
router.delete('/conversations/:id', chatController.deleteConversation);

// Message management
router.post('/conversations/:conversation_id/messages', chatController.saveMessage);

module.exports = router;
