const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    name_hi: {
        type: String
    },
    type: {
        type: String,
        required: true,
        enum: ['chemical', 'organic', 'biological', 'mechanical']
    },
    category: {
        type: String  // 'insecticide', 'fungicide', 'herbicide', 'biopesticide'
    },
    active_ingredient: {
        type: String
    },
    formulation: {
        type: String  // EC, WP, SC, WDG, etc.
    },
    manufacturer: {
        type: String
    },
    registration_number: {
        type: String  // CIR number in India
    },
    target_pests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pest'
    }],
    dosage_recommendations: [{
        crop_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Crop'
        },
        pest_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pest'
        },
        dosage: String,
        application_method: String,
        water_volume: String,
        frequency: String
    }],
    safety_info: {
        toxicity_class: {
            type: String  // WHO classification: Ia, Ib, II, III, U
        },
        ppe_requirements: [{
            type: String  // Gloves, mask, goggles, etc.
        }],
        first_aid: {
            type: String
        },
        first_aid_hi: {
            type: String
        },
        antidote: {
            type: String
        },
        environmental_impact: {
            type: String
        }
    },
    application_details: {
        pre_harvest_interval: {
            type: Number  // Days
        },
        re_entry_interval: {
            type: Number  // Hours
        },
        spray_volume: {
            type: String  // Liters per acre
        },
        timing: {
            type: String  // Best time to apply
        },
        weather_conditions: {
            type: String  // Ideal conditions
        }
    },
    restrictions: {
        banned_crops: [{
            type: String
        }],
        buffer_zones: {
            type: String
        },
        max_applications: {
            type: Number
        },
        resistance_management: {
            type: String
        }
    },
    effectiveness: {
        rating: {
            type: Number,  // 1-5
            min: 1,
            max: 5,
            default: 3
        },
        control_duration: {
            type: String  // How long it controls the pest
        },
        best_for: [{
            type: String  // Conditions where most effective
        }]
    },
    availability: {
        common: {
            type: Boolean,
            default: true
        },
        price_range: {
            type: String
        },
        pack_sizes: [{
            type: String
        }],
        alternatives: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Treatment'
        }]
    },
    compatibility: {
        can_mix_with: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Treatment'
        }],
        cannot_mix_with: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Treatment'
        }]
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

// Indexes for faster queries
treatmentSchema.index({ type: 1 });
treatmentSchema.index({ category: 1 });
treatmentSchema.index({ target_pests: 1 });
treatmentSchema.index({ name: 1 });

// Text search
treatmentSchema.index({ name: 'text', active_ingredient: 'text' });

module.exports = mongoose.model('Treatment', treatmentSchema);
