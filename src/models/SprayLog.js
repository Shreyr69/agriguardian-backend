const mongoose = require('mongoose');

const sprayLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
    },
    pesticide_name: {
        type: String,
        required: true
    },
    dose: {
        type: String
    },
    spray_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: {
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

// Index for user queries sorted by date
sprayLogSchema.index({ user_id: 1, spray_date: -1 });

module.exports = mongoose.model('SprayLog', sprayLogSchema);
