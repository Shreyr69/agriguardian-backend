const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// All AI routes require authentication
router.use(authMiddleware);

router.post('/chat', aiController.chat);
router.post('/identify-image', aiController.identifyImage);
router.post('/symptom-check', aiController.symptomCheck);
router.post('/advisory', aiController.generateAdvisory);

module.exports = router;
