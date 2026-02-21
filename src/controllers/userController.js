const User = require('../models/User');
const UserCrop = require('../models/UserCrop');

// GET /api/user/profile (requires auth)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                phone: user.phone,
                location: user.location,
                language: user.language,
                profileImage: user.profileImage,
                roles: user.roles,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// PUT /api/user/profile (requires auth)
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, location, language, profileImage } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (location) updates.location = location;
        if (language) updates.language = language;
        if (profileImage !== undefined) updates.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user.getProfile());
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/user/crops (requires auth)
exports.getUserCrops = async (req, res) => {
    try {
        const userCrops = await UserCrop.find({ user_id: req.userId })
            .populate('crop_id', 'name name_hi stages')
            .sort({ created_at: -1 });

        res.json(userCrops);
    } catch (error) {
        console.error('Get user crops error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/user/crops (requires auth)
exports.addUserCrop = async (req, res) => {
    try {
        console.log('Add crop request body:', req.body);
        console.log('User ID from auth:', req.userId);

        const { crop_id, stage } = req.body;

        if (!crop_id) {
            console.log('Error: crop_id is missing');
            return res.status(400).json({ error: 'Crop ID is required' });
        }

        // Validate crop_id is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(crop_id)) {
            console.log('Error: Invalid crop_id format:', crop_id);
            return res.status(400).json({ error: 'Invalid crop ID format' });
        }

        // Check if already exists
        const existing = await UserCrop.findOne({ user_id: req.userId, crop_id });
        if (existing) {
            console.log('Error: Crop already exists for user');
            return res.status(400).json({ error: 'Crop already added' });
        }

        const userCrop = new UserCrop({
            user_id: req.userId,
            crop_id,
            stage: stage || 'seedling',
            is_active: true
        });

        await userCrop.save();
        await userCrop.populate('crop_id', 'name name_hi stages');

        console.log('Crop added successfully:', userCrop);
        res.status(201).json(userCrop);
    } catch (error) {
        console.error('Add user crop error:', error);
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/user/crops/:id (requires auth)
exports.updateUserCrop = async (req, res) => {
    try {
        const { stage, is_active } = req.body;

        const updates = {};
        if (stage) updates.stage = stage;
        if (is_active !== undefined) updates.is_active = is_active;

        const userCrop = await UserCrop.findOneAndUpdate(
            { _id: req.params.id, user_id: req.userId },
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('crop_id', 'name name_hi stages');

        if (!userCrop) {
            return res.status(404).json({ error: 'User crop not found or unauthorized' });
        }

        res.json(userCrop);
    } catch (error) {
        console.error('Update user crop error:', error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/user/crops/:id (requires auth)
exports.deleteUserCrop = async (req, res) => {
    try {
        const userCrop = await UserCrop.findOne({
            _id: req.params.id,
            user_id: req.userId
        });

        if (!userCrop) {
            return res.status(404).json({ error: 'User crop not found or unauthorized' });
        }

        await userCrop.deleteOne();

        res.json({ message: 'Crop removed successfully' });
    } catch (error) {
        console.error('Delete user crop error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/user/profile/upload-image (requires auth)
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { uploadImage } = require('../services/cloudinaryService');

        // Upload to Cloudinary
        const result = await uploadImage(req.file.buffer, 'agri-guardian/profiles');

        // Update user profile with new image URL
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: { profileImage: result.secure_url } },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile image uploaded successfully',
            profileImage: result.secure_url,
            profile: user.getProfile()
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        res.status(500).json({ error: error.message });
    }
};
