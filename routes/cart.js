import express from 'express';
import * as cartController from '../controllers/cart.js';

const router = express.Router();

router.get('/', cartController.getCart);

router.post(
    '/items',
    cartController.addToCart
);

router.patch(
    '/items',
    cartController.updateCartItem
);

router.delete(
    '/items/:productId',
    cartController.removeFromCart
);

export default router;