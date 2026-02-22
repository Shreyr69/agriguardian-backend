const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');

// Public routes - anyone can view crops
router.get('/', cropController.getAllCrops);
router.get('/:id', cropController.getCropById);

module.exports = router;
