const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    crop_context: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: 'Punjab, India'
    },
    language: {
        type: String,
        enum: ['en', 'hi', 'en-GB', 'en-US', 'hi-IN'],
        default: 'en'
    },
    last_message_at: {
        type: Date,
        default: Date.now
    },
    message_count: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    pinned: {
        type: Boolean,
        default: false
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

// Indexes for performance
chatConversationSchema.index({ user_id: 1, created_at: -1 });
chatConversationSchema.index({ user_id: 1, is_active: 1 });
chatConversationSchema.index({ last_message_at: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
