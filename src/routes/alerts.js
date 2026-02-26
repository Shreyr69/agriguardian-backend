const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/auth');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// Public route - anyone can view alerts
router.get('/', alertController.getAlerts);

// Protected routes - require authentication for personalized data
router.get('/weather-forecast', authMiddleware, alertController.getWeatherForecast);
router.get('/ai-alerts', authMiddleware, alertController.getAIAlerts);

module.exports = router;
