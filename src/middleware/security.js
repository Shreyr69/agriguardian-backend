const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Security middleware configuration
const securityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false, // Allow embedding
    }));

    // Data sanitization against NoSQL injection
    app.use(mongoSanitize({
        replaceWith: '_', // Replace prohibited characters with underscore
    }));

    // Prevent HTTP parameter pollution
    app.use(hpp());
};

module.exports = securityMiddleware;
