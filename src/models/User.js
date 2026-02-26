const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // Profile fields (merged from profiles table)
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: 'Punjab, India'
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'hi']
    },
    profileImage: {
        type: String,
        default: null
    },
    // Roles (merged from user_roles table)
    roles: [{
        type: String,
        enum: ['farmer', 'expert', 'admin'],
        default: 'farmer'
    }],
    // Metadata for compatibility with Supabase user object
    user_metadata: {
        type: Object,
        default: function () {
            return { name: this.name };
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            // Match Supabase user object structure
            ret.id = ret._id;
            ret.user_id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password; // Never send password to client
            return ret;
        }
    }
});

// Indexes for better query performance
// Note: email index created automatically by unique: true
userSchema.index({ location: 1 }); // Location-based queries
userSchema.index({ createdAt: -1 }); // Sorting by registration date

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (matches Supabase profile structure)
userSchema.methods.getProfile = function () {
    return {
        id: this._id,
        user_id: this._id,
        name: this.name,
        phone: this.phone,
        location: this.location,
        language: this.language,
        profileImage: this.profileImage,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);
