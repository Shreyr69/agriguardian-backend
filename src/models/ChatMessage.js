const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatConversation',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        likelyPests: [{
            name: String,
            confidence: Number
        }],
        actions: [String],
        warnings: [String],
        followUpQuestions: [String],
        crop_mentioned: String,
        symptoms_mentioned: [String]
    },
    ai_model: {
        type: String,
        default: 'openai/gpt-oss-120b'
    },
    tokens_used: {
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

// Indexes for performance
chatMessageSchema.index({ conversation_id: 1, created_at: 1 });
chatMessageSchema.index({ user_id: 1, created_at: -1 });
chatMessageSchema.index({ conversation_id: 1, role: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
