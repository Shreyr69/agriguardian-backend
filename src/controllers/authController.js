const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and name are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Create user with default farmer role
        const user = new User({
            email: email.toLowerCase(),
            password,
            name,
            roles: ['farmer']
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return user data (password excluded by User model toJSON)
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            roles: user.roles,
            location: user.location,
            language: user.language
        };

        res.status(201).json({
            success: true,
            access_token: token,
            user: userResponse
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user data
        const userResponse = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            roles: user.roles,
            location: user.location,
            language: user.language
        };

        res.json({
            success: true,
            access_token: token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return Supabase-compatible user object
        res.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                user_metadata: { name: user.name }
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/auth/logout (optional - client-side token removal is enough)
exports.logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};
