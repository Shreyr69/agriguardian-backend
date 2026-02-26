const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image_url: {
        type: String
    },
    location: {
        type: String
    },
    status: {
        type: String,
        enum: ['open', 'resolved', 'closed'],
        default: 'open'
    },
    upvotes: {
        type: Number,
        default: 0
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

// Indexes for queries
communityPostSchema.index({ created_at: -1 });
communityPostSchema.index({ user_id: 1 });
communityPostSchema.index({ crop_id: 1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
