import { body, validationResult } from 'express-validator';
import { deleteFile } from '../services/fileService.js';

const createProductValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Product name must be between 3 and 100 characters'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),

    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be greater than or equal to 0'),

    body('category')
        .notEmpty()
        .withMessage('Category is required'),

    body('countInStock')
        .notEmpty()
        .withMessage('Stock count is required')
        .isInt({ min: 0 })
        .withMessage('Stock count must be a positive integer'),

    body('brand')
        .optional()
        .trim(),

    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array'),

    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            if (req.files) {
                for (const file of req.files) {
                    await deleteFile(file.path);
                }
            }

            return res.status(400).json({
                status: 'fail',
                errors: errors.array()
            });
        }

        next();
    }
];


const editProductValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Product name must be between 3 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Description cannot be empty'),

    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be greater than or equal to 0'),

    body('category')
        .optional()
        .notEmpty()
        .withMessage('Category cannot be empty'),

    body('countInStock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock count must be a positive integer'),

    body('brand')
        .optional()
        .trim(),

    body('images')
        .optional()
        .isArray()
        .withMessage('Images must be an array'),

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
    createProductValidation,
    editProductValidation
};