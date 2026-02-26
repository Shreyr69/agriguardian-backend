const mongoose = require('mongoose');

const userCropSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: true
    },
    stage: {
        type: String,
        default: 'seedling'
        // Removed enum to allow dynamic stages per crop
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Unique constraint: user can't add same crop twice
userCropSchema.index({ user_id: 1, crop_id: 1 }, { unique: true });

module.exports = mongoose.model('UserCrop', userCropSchema);
