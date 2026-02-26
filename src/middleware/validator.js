const { validationResult } = require('express-validator');

// Generic validation middleware to check for errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Format errors to be cleaner
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        console.log('[Validation Error]', JSON.stringify(formattedErrors, null, 2));

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: formattedErrors
        });
    }
    next();
};

module.exports = { validate };
