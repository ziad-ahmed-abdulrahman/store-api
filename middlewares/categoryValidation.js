import { body, validationResult } from 'express-validator';


const createCategoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Category name must be between 3 and 100 characters'),

    body('icon')
        .optional()
        .trim(),

    body('color')
        .optional()
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'fail',
                errors: errors.array()
            });
        }

        next();
    }
];


const editCategoryValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category name cannot be empty')
        .isLength({ min: 3, max: 100 })
        .withMessage('Category name must be between 3 and 100 characters'),

    body('icon')
        .optional()
        .trim(),

    body('color')
        .optional()
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'fail',
                errors: errors.array()
            });
        }

        next();
    }
];


export {
    createCategoryValidation,
    editCategoryValidation
};