import { body, validationResult } from 'express-validator';

const registerValidation = [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('First name must be between 3 and 100 characters'),

    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Last name must be between 3 and 100 characters'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain an uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain a lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain a number')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Password must contain a special character'),

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

const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

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
    registerValidation,
    loginValidation
};