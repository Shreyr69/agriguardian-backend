const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        enum: ['chat', 'image', 'symptom']
    },
    input_summary: {
        type: String
    },
    output_summary: {
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

// Index for user AI usage tracking
aiLogSchema.index({ user_id: 1, created_at: -1 });
aiLogSchema.index({ type: 1 });

module.exports = mongoose.model('AILog', aiLogSchema);
