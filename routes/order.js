import express from 'express';
import * as orderController from '../controllers/order.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// ─── User ────────────────────────────────────────────────────────────────────

router.post(
    '/',
    authMiddleware,
    orderController.createOrder
);

router.post(
    '/paymob/webhook',
    orderController.paymobWebhook
);

router.post(
    '/:id/pay',
    authMiddleware,
    orderController.payOrder
);

router.patch(
    '/:id/cancel',
    authMiddleware,
    orderController.cancelOrder
);

router.get(
    '/me',
    authMiddleware,
    orderController.getMyOrders
);

router.get(
    '/me/:id',
    authMiddleware,
    orderController.getSingleOrder
);

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get(
    '/',
    authMiddleware,
    adminMiddleware,
    orderController.adminGetAllOrders
);

router.get(
    '/:id',
    authMiddleware,
    adminMiddleware,
    orderController.adminGetSingleOrder
);

export default router;