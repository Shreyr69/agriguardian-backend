const express = require('express');
const router = express.Router();
const pestController = require('../controllers/pestController');

// Public routes - anyone can view pests
router.get('/', pestController.getAllPests);
router.get('/:id', pestController.getPestById);

module.exports = router;
