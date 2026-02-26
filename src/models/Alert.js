const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    title_hi: {
        type: String
    },
    description: {
        type: String
    },
    description_hi: {
        type: String
    },
    risk_level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
    },
    location: {
        type: String
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Index for active alerts
alertSchema.index({ is_active: 1, created_at: -1 });
alertSchema.index({ crop_id: 1 });

module.exports = mongoose.model('Alert', alertSchema);
