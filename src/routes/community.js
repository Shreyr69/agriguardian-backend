const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/auth');

// Public - anyone can read
router.get('/posts', communityController.getAllPosts);
router.get('/posts/:id/replies', communityController.getReplies);

// Protected - require auth to create/like
router.post('/posts', authMiddleware, communityController.createPost);
router.post('/posts/:id/like', authMiddleware, communityController.toggleLike);
router.post('/posts/:id/replies', authMiddleware, communityController.createReply);
router.delete('/posts/:id', authMiddleware, communityController.deletePost);
router.delete('/posts/:postId/replies/:replyId', authMiddleware, communityController.deleteReply);

module.exports = router;
