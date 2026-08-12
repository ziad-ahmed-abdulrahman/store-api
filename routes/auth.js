import express from 'express';
import * as authController from '../controllers/auth.js';
import { registerValidation, loginValidation } from '../middlewares/authValidation.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

router
    .route('/register')
    .post(rateLimiter(10, 5), registerValidation, authController.register);

router
    .route('/login')
    .post(rateLimiter(10, 5), loginValidation, authController.login);

router
    .route('/send-activation-code')
    .post(rateLimiter(10, 2), authController.sendActivationCode);

router
    .route('/activate')
    .post(rateLimiter(10, 5), authController.activate);

router
    .route('/send-forget-password-code')
    .post(rateLimiter(10, 2), authController.sendForgetPasswordCode);

router
    .route('/reset-password')
    .post(rateLimiter(10, 5), authController.resetPassword);

export default router;