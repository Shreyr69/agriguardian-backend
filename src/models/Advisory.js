const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema({
    pest_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pest',
        required: true,
        unique: true
    },
    // IPM (Integrated Pest Management) recommendations
    prevention: [{
        type: String
    }],
    prevention_hi: [{
        type: String
    }],
    mechanical: [{
        type: String
    }],
    mechanical_hi: [{
        type: String
    }],
    biological: [{
        type: String
    }],
    biological_hi: [{
        type: String
    }],
    chemical: [{
        type: String
    }],
    chemical_hi: [{
        type: String
    }],
    dosage: {
        type: String
    },
    dosage_hi: {
        type: String
    },
    safety: {
        type: String
    },
    safety_hi: {
        type: String
    },
    notes: {
        type: String
    },
    notes_hi: {
        type: String
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

// Note: pest_id index automatically created by unique: true option above

module.exports = mongoose.model('Advisory', advisorySchema);
