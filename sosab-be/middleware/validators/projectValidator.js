const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = {};
        errors.array().forEach(error => {
            if (!formattedErrors[error.path]) {
                formattedErrors[error.path] = [];
            }
            formattedErrors[error.path].push(error.msg);
        });

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }

    next();
};

/**
 * Validation rules for creating a project
 */
const validateProjectCreate = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Project name must be between 2 and 200 characters'),

    body('location')
        .trim()
        .notEmpty()
        .withMessage('Project location is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Location must be between 2 and 200 characters'),

    body('coordinates')
        .optional()
        .isObject()
        .withMessage('Coordinates must be an object')
        .custom((value) => {
            if (value && (typeof value.lat !== 'number' || typeof value.lng !== 'number')) {
                throw new Error('Coordinates must contain numeric lat and lng');
            }
            return true;
        }),

    body('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid date')
        .toDate(),

    body('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be a valid date')
        .toDate()
        .custom((endDate, { req }) => {
            if (new Date(endDate) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('budget')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget must be a positive number')
        .toFloat(),

    body('managerId')
        .optional()
        .isMongoId()
        .withMessage('Invalid manager ID format'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),

    body('status')
        .optional()
        .isIn(['active', 'completed', 'on_hold', 'cancelled'])
        .withMessage('Status must be one of: active, completed, on_hold, cancelled'),

    body('progress')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Progress must be between 0 and 100')
        .toInt(),

    handleValidationErrors
];

/**
 * Validation rules for updating a project
 */
const validateProjectUpdate = [
    param('id')
        .isMongoId()
        .withMessage('Invalid project ID format'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Project name must be between 2 and 200 characters'),

    body('location')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Location must be between 2 and 200 characters'),

    body('coordinates')
        .optional()
        .isObject()
        .withMessage('Coordinates must be an object')
        .custom((value) => {
            if (value && (typeof value.lat !== 'number' || typeof value.lng !== 'number')) {
                throw new Error('Coordinates must contain numeric lat and lng');
            }
            return true;
        }),

    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date')
        .toDate(),

    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
        .toDate()
        .custom((endDate, { req }) => {
            // Only validate if both dates are provided
            if (endDate && req.body.startDate) {
                if (new Date(endDate) <= new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
            }
            return true;
        }),

    body('budget')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget must be a positive number')
        .toFloat(),

    body('managerId')
        .optional()
        .isMongoId()
        .withMessage('Invalid manager ID format'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),

    body('status')
        .optional()
        .isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'])
        .withMessage('Status must be one of: Planning, Active, On Hold, Completed, Cancelled'),

    body('progress')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Progress must be between 0 and 100')
        .toInt(),

    handleValidationErrors
];

/**
 * Validation rules for getting a project by ID
 */
const validateGetProjectById = [
    param('id')
        .isMongoId()
        .withMessage('Invalid project ID format'),

    handleValidationErrors
];

/**
 * Validation rules for deleting a project
 */
const validateDeleteProject = [
    param('id')
        .isMongoId()
        .withMessage('Invalid project ID format'),

    handleValidationErrors
];

module.exports = {
    validateProjectCreate,
    validateProjectUpdate,
    validateGetProjectById,
    validateDeleteProject,
    handleValidationErrors
};
