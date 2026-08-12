import express from 'express';
import * as productController from '../controllers/product.js';
import uploadProductImages from '../middlewares/uploadProductImages.js';
import { createProductValidation, editProductValidation } from '../middlewares/productValidation.js';
import rateLimiter from '../middlewares/rateLimiter.js'
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();
router.use(rateLimiter(60, 60));

router.route('/')
    .get(productController.getAllProducts)
    .post(authMiddleware
        , adminMiddleware
        , uploadProductImages.array('images', 5), createProductValidation, productController.createProduct);

router.route('/:id')
    .get(productController.getSingleProduct)
    .patch(authMiddleware
        , adminMiddleware
        , editProductValidation, productController.editProduct)
    .delete(authMiddleware
        , adminMiddleware
        , productController.deleteProduct);

export default router;