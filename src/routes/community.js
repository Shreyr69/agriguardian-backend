const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/auth');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// Public - anyone can read
router.get('/posts', communityController.getAllPosts);
router.get('/posts/:id/replies', validateMongoId('id'), validate, communityController.getReplies);

// Protected - require auth to create/like
router.post('/posts', authMiddleware, communityController.createPost);
router.post('/posts/:id/like', authMiddleware, validateMongoId('id'), validate, communityController.toggleLike);
router.post('/posts/:id/replies', authMiddleware, validateMongoId('id'), validate, communityController.createReply);
router.delete('/posts/:id', authMiddleware, validateMongoId('id'), validate, communityController.deletePost);
router.delete('/posts/:postId/replies/:replyId', authMiddleware, validateMongoId('postId'), validateMongoId('replyId'), validate, communityController.deleteReply);

module.exports = router;
