const express = require('express');
const router = express.Router();
const sprayLogController = require('../controllers/sprayLogController');
const authMiddleware = require('../middleware/auth');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// Protected routes (require auth)
router.use(authMiddleware);

router.get('/', sprayLogController.getSprayLogs);
router.post('/', sprayLogController.createSprayLog);
router.delete('/:id', validateMongoId('id'), validate, sprayLogController.deleteSprayLog);

module.exports = router;
