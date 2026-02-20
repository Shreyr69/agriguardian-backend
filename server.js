require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
const app = require('./src/app');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('✅ Connected to MongoDB Atlas');

        // Start server
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📡 Client URL: ${process.env.CLIENT_URL}`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                logger.info('HTTP server closed');
                mongoose.connection.close(false, () => {
                    logger.info('MongoDB connection closed');
                    process.exit(0);
                });
            });
        });
    })
    .catch((err) => {
        logger.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});
