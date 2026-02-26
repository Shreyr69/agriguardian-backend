const express = require('express');
const router = express.Router();
const pestController = require('../controllers/pestController');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// Public routes - anyone can view pests
router.get('/', pestController.getAllPests);
router.get('/:id', validateMongoId('id'), validate, pestController.getPestById);


module.exports = router;
