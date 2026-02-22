const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    name_hi: {
        type: String
    },
    seasons: [{
        type: String
    }],
    stages: [{
        type: String,
        default: ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest']
    }],
    image_url: {
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

// Note: name index automatically created by unique: true option above

module.exports = mongoose.model('Crop', cropSchema);
