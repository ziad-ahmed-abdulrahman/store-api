import crypto from 'crypto';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import User from '../models/user.js';
import Order from '../models/order.js';
import httpStatusText from '../utils/httpStatusText.js';

const releaseStock = async (items) => {
    for (const item of items) {
        await Product.updateOne(
            { _id: item.product },
            { $inc: { countInStock: item.quantity } }
        );
    }
};

const createOrder = async (req, res) => {
    const { shippingAddress, phoneNumber } = req.body;

    if (!shippingAddress || !phoneNumber) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Shipping address and phone number are required',
            data: null
        });
    }

    const cartId = req.cookies.cartId;
    if (!cartId) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Cart is empty',
            data: null
        });
    }

    const cart = await Cart.findOne({ cartId });
    if (!cart || cart.items.length === 0) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Cart is empty',
            data: null
        });
    }

    const orderItems = [];
    let totalPrice = 0;
    const reservedItems = [];

    try {
        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product not found`);
            }

            const updateResult = await Product.updateOne(
                { _id: item.product, countInStock: { $gte: item.quantity } },
                { $inc: { countInStock: -item.quantity } }
            );

            if (updateResult.modifiedCount === 0) {
                throw new Error(`Not enough stock for ${product.name}`);
            }

            reservedItems.push({
                product: item.product,
                quantity: item.quantity
            });

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });

            totalPrice += product.price * item.quantity;
        }

        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            totalPrice,
            status: 'pending',
            shippingAddress,
            phoneNumber
        });

        await Cart.deleteOne({ cartId });

        return res.status(201).json({
            status: httpStatusText.SUCCESS,
            message: 'Order created successfully',
            data: {
                orderId: order._id,
                totalPrice: order.totalPrice,
                status: order.status
            }
        });

    } catch (error) {
        await releaseStock(reservedItems);

        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: error.message,
            data: null
        });
    }
};

const payOrder = async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user.id
    });

    if (!order) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Order not found',
            data: null
        });
    }

    if (order.status === 'paid') {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Order is already paid',
            data: null
        });
    }

    if (order.status === 'cancelled') {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Order is cancelled and cannot be paid',
            data: null
        });
    }

    if (order.status === 'payment_pending' && order.paymentIntentId && order.clientSecret) {
        const paymentUrl =
            `${process.env.PAYMOB_BASE_URL}/unifiedcheckout/` +
            `?publicKey=${process.env.PAYMOB_PUBLIC_KEY}` +
            `&clientSecret=${order.clientSecret}`;

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Payment checkout retrieved (already pending)',
            data: {
                orderId: order._id,
                totalPrice: order.totalPrice,
                status: order.status,
                paymentUrl
            }
        });
    }

    const lockedOrder = await Order.findOneAndUpdate(
        {
            _id: order._id,
            status: { $in: ['pending', 'payment_failed'] }
        },
        {
            $set: { status: 'payment_pending' }
        },
        { new: true }
    );

    if (!lockedOrder) {
        const updatedOrder = await Order.findById(order._id);
        if (updatedOrder && updatedOrder.status === 'payment_pending' && updatedOrder.paymentIntentId && updatedOrder.clientSecret) {
            const paymentUrl =
                `${process.env.PAYMOB_BASE_URL}/unifiedcheckout/` +
                `?publicKey=${process.env.PAYMOB_PUBLIC_KEY}` +
                `&clientSecret=${updatedOrder.clientSecret}`;

            return res.status(200).json({
                status: httpStatusText.SUCCESS,
                message: 'Payment checkout retrieved (concurrent session locked)',
                data: {
                    orderId: updatedOrder._id,
                    totalPrice: updatedOrder.totalPrice,
                    status: updatedOrder.status,
                    paymentUrl
                }
            });
        }

        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Order status does not allow payment initiation',
            data: null
        });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        await Order.updateOne(
            { _id: order._id, status: 'payment_pending' },
            { $set: { status: 'pending' } }
        );

        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'User not found',
            data: null
        });
    }

    const amount = Math.round(order.totalPrice * 100);
    const notification_url = `${process.env.BASE_URL || (req.protocol + '://' + req.get('host'))}/api/orders/paymob/webhook`;

    try {
        const response = await fetch(
            `${process.env.PAYMOB_BASE_URL}/v1/intention/`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount,
                    currency: 'EGP',
                    payment_methods: [
                        Number(process.env.PAYMOB_INTEGRATION_ID)
                    ],
                    items: order.items.map(item => ({
                        name: `Product ${item.product}`,
                        amount: Math.round(item.price * 100),
                        description: 'E-commerce product',
                        quantity: item.quantity
                    })),
                    billing_data: {
                        first_name: user.firstName,
                        last_name: user.lastName,
                        email: user.email,
                        phone_number: order.phoneNumber,
                        apartment: 'NA',
                        floor: 'NA',
                        address: order.shippingAddress,
                        country: 'EG'
                    },
                    customer: {
                        first_name: user.firstName,
                        last_name: user.lastName,
                        email: user.email
                    },
                    special_reference: order._id.toString(),
                    notification_url,
                    redirection_url: `${process.env.FRONTEND_URL}/payment/complete`
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Paymob Intention API error details:', data);
            throw new Error(data.message || 'Payment gateway returned error');
        }

        lockedOrder.paymentIntentId = data.id;
        lockedOrder.clientSecret = data.client_secret;
        await lockedOrder.save();

        const paymentUrl =
            `${process.env.PAYMOB_BASE_URL}/unifiedcheckout/` +
            `?publicKey=${process.env.PAYMOB_PUBLIC_KEY}` +
            `&clientSecret=${data.client_secret}`;

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Payment checkout created',
            data: {
                orderId: order._id,
                totalPrice: order.totalPrice,
                status: lockedOrder.status,
                paymentUrl
            }
        });

    } catch (error) {
        console.error('Payment checkout setup failure:', error);
        
        await Order.updateOne(
            { _id: order._id, status: 'payment_pending' },
            { $set: { status: 'pending' } }
        );

        return res.status(502).json({
            status: httpStatusText.FAIL,
            message: 'Payment gateway error',
            data: error.message
        });
    }
};

const paymobWebhook = async (req, res) => {
    const receivedHmac = req.query.hmac || req.body.hmac || '';
    const payload = req.body;
    
    const transaction = payload.obj || payload.transaction;

    if (!transaction) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid webhook data - no transaction object'
        });
    }

    const hmacFields = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order.id',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success'
    ];

    const getValue = value => {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        return String(value);
    };

    const stringToHash = hmacFields
        .map(field => {
            if (field === 'order.id') {
                if (transaction.order && typeof transaction.order === 'object') {
                    return getValue(transaction.order.id);
                }
                return getValue(transaction.order);
            }
            if (field.startsWith('source_data.')) {
                const subField = field.split('.')[1];
                if (transaction.source_data && typeof transaction.source_data === 'object') {
                    return getValue(transaction.source_data[subField]);
                }
                return '';
            }
            return getValue(transaction[field]);
        })
        .join('');

    const calculatedHmac = crypto
        .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
        .update(stringToHash)
        .digest('hex');

    if (!receivedHmac || calculatedHmac.length !== receivedHmac.length) {
        return res.status(403).json({
            status: httpStatusText.FAIL,
            message: 'Invalid HMAC signature length or missing'
        });
    }

    if (!crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, 'utf-8'),
        Buffer.from(receivedHmac, 'utf-8')
    )) {
        return res.status(403).json({
            status: httpStatusText.FAIL,
            message: 'Invalid HMAC signature match'
        });
    }

    const orderId =
        payload.intention?.special_reference ||
        payload.obj?.order?.merchant_order_id ||
        payload.obj?.payment_intent?.special_reference ||
        transaction.order?.merchant_order_id;

    if (!orderId) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Order reference ID not found in webhook payload'
        });
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Order not found'
        });
    }

    if (order.status === 'paid') {
        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Payment already processed (idempotent)',
            data: {
                orderId: order._id,
                status: order.status
            }
        });
    }

    const isSuccess = transaction.success === true && transaction.pending === false;

    if (isSuccess) {
        order.status = 'paid';
        order.paymentTransactionId = String(transaction.id);
        order.paidAt = new Date();
        await order.save();

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Payment confirmed successfully',
            data: {
                orderId: order._id,
                status: order.status
            }
        });
    } else {
        if (transaction.pending === false) {
            order.status = 'payment_failed';
            order.paymentTransactionId = String(transaction.id);
            await order.save();

            return res.status(200).json({
                status: httpStatusText.SUCCESS,
                message: 'Payment failed registered',
                data: {
                    orderId: order._id,
                    status: order.status
                }
            });
        }
        
        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            message: 'Payment transaction is pending',
            data: {
                orderId: order._id,
                status: order.status
            }
        });
    }
};

const getMyOrders = async (req, res) => {
    const orders = await Order.find({
        user: req.user.id
    })
        .select('-__v')
        .populate({
            path: 'items.product',
            select: 'name price images'
        })
        .sort('-createdAt');

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: orders
    });
};

const getSingleOrder = async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user.id
    })
        .select('-__v')
        .populate({
            path: 'items.product',
            select: 'name price images'
        });

    if (!order) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Order not found',
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: order
    });
};

const cancelOrder = async (req, res) => {
    const order = await Order.findOneAndUpdate(
        {
            _id: req.params.id,
            user: req.user.id,
            status: { $in: ['pending', 'payment_failed'] }
        },
        {
            $set: {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        },
        { new: true }
    );

    if (!order) {
        const existingOrder = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!existingOrder) {
            return res.status(404).json({
                status: httpStatusText.FAIL,
                message: 'Order not found',
                data: null
            });
        }

        let errMsg = 'Only pending or failed payment orders can be cancelled';
        if (existingOrder.status === 'payment_pending') {
            errMsg = 'Payment is in progress. Order cannot be cancelled during checkout.';
        } else if (existingOrder.status === 'paid') {
            errMsg = 'Paid orders cannot be cancelled';
        } else if (existingOrder.status === 'cancelled') {
            errMsg = 'Order is already cancelled';
        }

        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: errMsg,
            data: null
        });
    }

    await releaseStock(order.items);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Order cancelled successfully',
        data: null
    });
};

const adminGetAllOrders = async (req, res) => {
    const {
        status,
        page  = 1,
        limit = 10,
        sort  = '-createdAt'
    } = req.query;

    const filter = {};

    const allowedStatuses = ['pending', 'payment_pending', 'paid', 'cancelled', 'payment_failed'];
    if (status && allowedStatuses.includes(status)) {
        filter.status = status;
    }

    const pageNumber  = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip        = (pageNumber - 1) * limitNumber;

    const [orders, totalOrders] = await Promise.all([
        Order.find(filter, { __v: false, clientSecret: false })
            .populate({ path: 'user',          select: 'firstName lastName email' })
            .populate({ path: 'items.product', select: 'name price images' })
            .sort(sort)
            .skip(skip)
            .limit(limitNumber),

        Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalOrders / limitNumber);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: orders,
        pagination: {
            currentPage: pageNumber,
            limit: limitNumber,
            totalOrders,
            totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
        }
    });
};

const adminGetSingleOrder = async (req, res) => {
    const order = await Order.findById(req.params.id)
        .select('-__v -clientSecret')
        .populate({ path: 'user',          select: 'firstName lastName email phoneNumber' })
        .populate({ path: 'items.product', select: 'name price images' });

    if (!order) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Order not found',
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: order
    });
};

export {
    createOrder,
    payOrder,
    paymobWebhook,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    adminGetAllOrders,
    adminGetSingleOrder
};