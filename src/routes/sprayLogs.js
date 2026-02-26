const express = require('express');
const router = express.Router();
const sprayLogController = require('../controllers/sprayLogController');
const authMiddleware = require('../middleware/auth');

// All spray log routes require authentication
router.use(authMiddleware);

router.get('/', sprayLogController.getSprayLogs);
router.post('/', sprayLogController.createSprayLog);
router.delete('/:id', sprayLogController.deleteSprayLog);

module.exports = router;
