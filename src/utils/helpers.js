// Common helper functions for backend

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a standardized API response
 */
const apiResponse = (res, statusCode, data = null, message = null) => {
    const response = {};

    if (data !== null) {
        response.data = data;
    }

    if (message !== null) {
        response.message = message;
    }

    return res.status(statusCode).json(response);
};

/**
 * Create a standardized error response
 */
const errorResponse = (res, statusCode, message, details = null) => {
    const response = { error: message };

    if (details) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};

/**
 * Paginate query results
 */
const paginate = (page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const skip = (pageNum - 1) * limitNum;

    return {
        skip,
        limit: limitNum,
        page: pageNum,
    };
};

/**
 * Build sort object from query params
 */
const buildSort = (sortBy = 'createdAt', order = 'desc') => {
    return { [sortBy]: order === 'asc' ? 1 : -1 };
};

/**
 * Sanitize user input to prevent XSS
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = {
    asyncHandler,
    apiResponse,
    errorResponse,
    paginate,
    buildSort,
    sanitizeInput,
    generateRandomString,
};
