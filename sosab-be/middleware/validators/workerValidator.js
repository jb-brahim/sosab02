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
 * Validation rules for creating a worker
 */
const validateWorkerCreate = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Worker name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Worker name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Worker name can only contain letters, spaces, hyphens, and apostrophes'),

    body('projectId')
        .notEmpty()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Invalid project ID format'),

    body('dailySalary')
        .notEmpty()
        .withMessage('Daily salary is required')
        .isFloat({ min: 0 })
        .withMessage('Daily salary must be a positive number')
        .toFloat(),

    body('contact')
        .optional()
        .custom((value) => {
            // Ensure contact is always an object, not a string
            if (typeof value === 'string') {
                throw new Error('Contact must be an object with phone and/or address fields');
            }
            return true;
        }),

    body('contact.phone')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[\d\s\-\+\(\)]*$/)
        .withMessage('Invalid phone number format. Use only digits, spaces, hyphens, plus signs, and parentheses'),

    body('contact.address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address cannot exceed 500 characters'),

    body('documents')
        .optional()
        .isArray()
        .withMessage('Documents must be an array'),

    body('documents.*.name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Document name is required'),

    body('documents.*.url')
        .optional()
        .trim()
        .isURL()
        .withMessage('Document URL must be valid'),

    body('documents.*.type')
        .optional()
        .trim()
        .isIn(['ID', 'Contract', 'Certificate', 'Other'])
        .withMessage('Document type must be ID, Contract, Certificate, or Other'),

    body('assignedTasks')
        .optional()
        .isArray()
        .withMessage('Assigned tasks must be an array'),

    body('assignedTasks.*')
        .optional()
        .isMongoId()
        .withMessage('Invalid task ID format'),

    handleValidationErrors
];

/**
 * Validation rules for updating a worker
 */
const validateWorkerUpdate = [
    param('id')
        .isMongoId()
        .withMessage('Invalid worker ID format'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Worker name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Worker name can only contain letters, spaces, hyphens, and apostrophes'),

    body('dailySalary')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Daily salary must be a positive number')
        .toFloat(),

    body('contact')
        .optional()
        .custom((value) => {
            // Ensure contact is always an object, not a string
            if (typeof value === 'string') {
                throw new Error('Contact must be an object with phone and/or address fields');
            }
            return true;
        }),

    body('contact.phone')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[\d\s\-\+\(\)]*$/)
        .withMessage('Invalid phone number format'),

    body('contact.address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address cannot exceed 500 characters'),

    body('documents')
        .optional()
        .isArray()
        .withMessage('Documents must be an array'),

    body('assignedTasks')
        .optional()
        .isArray()
        .withMessage('Assigned tasks must be an array'),

    body('active')
        .optional()
        .isBoolean()
        .withMessage('Active must be a boolean value'),

    handleValidationErrors
];

/**
 * Validation rules for getting workers by project
 */
const validateGetWorkersByProject = [
    param('projectId')
        .isMongoId()
        .withMessage('Invalid project ID format'),

    handleValidationErrors
];

/**
 * Sanitize worker data before saving
 * Ensures contact is always an object
 */
const sanitizeWorkerData = (req, res, next) => {
    if (req.body.contact) {
        // If contact is a string, convert it to object format
        if (typeof req.body.contact === 'string') {
            req.body.contact = {
                phone: req.body.contact,
                address: ''
            };
        }

        // Ensure contact is an object with proper structure
        if (typeof req.body.contact === 'object') {
            req.body.contact = {
                phone: req.body.contact.phone || '',
                address: req.body.contact.address || ''
            };
        }
    }

    next();
};

module.exports = {
    validateWorkerCreate,
    validateWorkerUpdate,
    validateGetWorkersByProject,
    sanitizeWorkerData,
    handleValidationErrors
};
