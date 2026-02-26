const { param, body } = require('express-validator');

// Mongo ObjectId parameter validation
const validateMongoId = (paramName = 'id') => {
    return [
        param(paramName)
            .exists().withMessage(`param ${paramName} is required`)
            .isMongoId().withMessage(`Invalid ${paramName} format: must be a MongoDB ObjectId`)
    ];
};

// Validates enum structures in the request body
const validateEnum = (fieldName, allowedValues) => {
    return [
        body(fieldName)
            .optional() // If it's optional, let it pass if not present
            .isIn(allowedValues)
            .withMessage(`Invalid value for ${fieldName}. Allowed values: ${allowedValues.join(', ')}`)
    ];
};

module.exports = {
    validateMongoId,
    validateEnum
};
