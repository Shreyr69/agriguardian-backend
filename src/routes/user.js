const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { validateMongoId } = require('../validators/commonValidator');
const { validate } = require('../middleware/validator');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// All user routes require authentication
router.use(authMiddleware);

// Profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/profile/upload-image', upload.single('profileImage'), userController.uploadProfileImage);

// User crops
router.get('/crops', userController.getUserCrops);
router.post('/crops', userController.addUserCrop);
router.put('/crops/:id', validateMongoId('id'), validate, userController.updateUserCrop);
router.delete('/crops/:id', validateMongoId('id'), validate, userController.deleteUserCrop);

module.exports = router;
