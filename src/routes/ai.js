const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// All AI routes require authentication
router.use(authMiddleware);

router.post('/chat', aiController.chat);
router.post('/identify-image', aiController.identifyImage);
router.post('/symptom-check', aiController.symptomCheck);
router.post('/advisory', aiController.generateAdvisory);

// Generate weather alerts
router.get('/weather-alerts', aiController.generateWeatherAlerts);

module.exports = router;
