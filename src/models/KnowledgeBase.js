const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['farming_practice', 'regional_guideline', 'crop_management', 'pest_management', 'ipm_strategy', 'seasonal_guide']
    },
    crop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
    },
    region: {
        type: String  // Punjab, Haryana, UP, etc.
    },
    title: {
        type: String,
        required: true
    },
    title_hi: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    content_hi: {
        type: String
    },
    keywords: [{
        type: String  // For semantic search and RAG
    }],
    source: {
        type: String,
        enum: ['expert', 'research', 'traditional', 'government'],
        default: 'expert'
    },
    confidence: {
        type: Number,  // 0-1 reliability score
        min: 0,
        max: 1,
        default: 0.8
    },
    seasonal_relevance: [{
        type: String,  // Kharif, Rabi, Zaid
        enum: ['Kharif', 'Rabi', 'Zaid', 'Year-round']
    }],
    applicability: {
        type: String  // Who this applies to: 'all', 'small_farmers', 'commercial', etc.
    },
    references: [{
        type: String  // Citations or sources
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
knowledgeBaseSchema.index({ category: 1 });
knowledgeBaseSchema.index({ crop_id: 1 });
knowledgeBaseSchema.index({ region: 1 });
knowledgeBaseSchema.index({ keywords: 1 });
knowledgeBaseSchema.index({ seasonal_relevance: 1 });

// Text search index for content
knowledgeBaseSchema.index({ title: 'text', content: 'text', keywords: 'text' });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
