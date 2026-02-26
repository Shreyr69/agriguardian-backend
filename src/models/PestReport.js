const mongoose = require('mongoose');

const pestReportSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
    },
    pest_guess: {
        type: String
    },
    symptoms: [{
        type: String
    }],
    severity: {
        type: String,
        enum: ['mild', 'medium', 'severe'],
        default: 'medium'
    },
    image_url: {
        type: String
    },
    location: {
        type: String
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

// Index for user queries
pestReportSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('PestReport', pestReportSchema);
