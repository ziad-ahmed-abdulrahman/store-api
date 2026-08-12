import express from 'express';
import * as userController from '../controllers/user.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

router
    .route('/me')
    .get(
        rateLimiter(60, 60),
        authMiddleware,
        userController.getMe
    )
    .patch(
        rateLimiter(60, 30),
        authMiddleware,
        userController.editMe
    )
    .delete(
        rateLimiter(60, 10),
        authMiddleware,
        userController.deleteMe
    );

router
    .route('/me/change-password')
    .patch(
        rateLimiter(60, 5),
        authMiddleware,
        userController.changePassword
    );

router
    .route('/')
    .get(
        rateLimiter(60, 60),
        authMiddleware,
        adminMiddleware,
        userController.getAllUsers
    )
    .post(
        rateLimiter(60, 20),
        authMiddleware,
        adminMiddleware,
        userController.createUser
    );

router
    .route('/:id')
    .get(
        rateLimiter(60, 60),
        authMiddleware,
        adminMiddleware,
        userController.getSingleUser
    )
    .patch(
        rateLimiter(60, 20),
        authMiddleware,
        adminMiddleware,
        userController.editUser
    )
    .delete(
        rateLimiter(60, 10),
        authMiddleware,
        adminMiddleware,
        userController.deleteUser
    );

export default router;