const mongoose = require('mongoose');

const userLikeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityPost',
        required: true
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

// Unique constraint: user can only like a post once
userLikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

module.exports = mongoose.model('UserLike', userLikeSchema);
