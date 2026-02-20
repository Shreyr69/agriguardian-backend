require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const securityMiddleware = require('./middleware/security');
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust proxy for production (Render, Heroku, etc.)
// This fixes the X-Forwarded-For header issue with rate limiting
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Import routes
const authRoutes = require('./routes/auth');
const cropRoutes = require('./routes/crops');
const pestRoutes = require('./routes/pests');
const sprayLogRoutes = require('./routes/sprayLogs');
const communityRoutes = require('./routes/community');
const userRoutes = require('./routes/user');
const alertRoutes = require('./routes/alerts');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');

// Security middleware
securityMiddleware(app);

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// CORS middleware - support multiple origins
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://agri-guardiann.vercel.app',
    'https://agriguardiann.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
            return callback(null, true);
        }

        // In production, be more strict
        if (process.env.NODE_ENV === 'production') {
            console.log('CORS blocked origin:', origin);
            return callback(new Error('Not allowed by CORS'), false);
        }

        // In development, allow all
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/crops', apiLimiter, cropRoutes);
app.use('/api/pests', apiLimiter, pestRoutes);
app.use('/api/spray-logs', apiLimiter, sprayLogRoutes);
app.use('/api/community', apiLimiter, communityRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/alerts', apiLimiter, alertRoutes);

// 404 handler
app.use((req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error occurred:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            error: `Duplicate value for field: ${field}`
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Default error
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
