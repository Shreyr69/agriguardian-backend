const mongoose = require('mongoose');

const pestSchema = new mongoose.Schema({
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    name_hi: {
        type: String
    },
    scientific_name: {
        type: String
    },
    images: [{
        type: String
    }],
    symptoms: [{
        type: String
    }],
    symptoms_hi: [{
        type: String
    }],
    lifecycle: {
        type: String
    },
    lifecycle_hi: {
        type: String
    },
    damage: {
        type: String
    },
    damage_hi: {
        type: String
    },
    season: {
        type: String
    },
    tags: [{
        type: String
    }]
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

// Indexes for faster queries
pestSchema.index({ crop_id: 1 });
pestSchema.index({ name: 1 });
pestSchema.index({ tags: 1 });

module.exports = mongoose.model('Pest', pestSchema);
