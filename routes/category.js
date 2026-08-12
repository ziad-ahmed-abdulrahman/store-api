import express from 'express';
import * as categoryController from '../controllers/category.js';
import { createCategoryValidation, editCategoryValidation } from '../middlewares/categoryValidation.js';
import rateLimiter from '../middlewares/rateLimiter.js'
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();
router.use(rateLimiter(60, 60));

router.route('/')
    .get(categoryController.getAllCategories)
    .post(authMiddleware
        , adminMiddleware
        , createCategoryValidation, categoryController.createCategory);

router.route('/:id')
    .get(categoryController.getSingleCategory)
    .patch(authMiddleware
        , adminMiddleware
        , editCategoryValidation, categoryController.editCategory)
    .delete(authMiddleware
        , adminMiddleware
        , categoryController.deleteCategory);

export default router;