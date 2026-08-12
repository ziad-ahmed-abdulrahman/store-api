import crypto from 'crypto';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import httpStatusText from '../utils/httpStatusText.js';

const getCartId = (req, res) => {
    let cartId = req.cookies.cartId;

    if (!cartId) {
        cartId = crypto.randomUUID();

        res.cookie('cartId', cartId, {
            httpOnly: true,
            sameSite: 'lax'
        });
    }

    return cartId;
};

const populateCart = async (cart) => {
    return await cart.populate({
        path: 'items.product',
        select: '-__v -description -category -dateCreated -isFeatured -numReviews -rating -brand'
    });
};

const formatCartResponse = (cart, cartId) => {
    const totalPrice = cart
        ? cart.items.reduce(
            (total, item) =>
                total + item.product.price * item.quantity,
            0
        )
        : 0;

    return {
        cartId,
        items: cart ? cart.items : [],
        totalPrice
    };
};

const getCart = async (req, res) => {
    const cartId = getCartId(req, res);

    const cart = await Cart.findOne(
        { cartId },
        {
            _id: false,
            cartId: true,
            items: true
        }
    );

    if (cart) {
        await populateCart(cart);
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: formatCartResponse(cart, cartId)
    });
};

const addToCart = async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Product not found',
            data: null
        });
    }

    if (product.countInStock < quantity) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Not enough stock',
            data: null
        });
    }

    const cartId = getCartId(req, res);

    let cart = await Cart.findOne({ cartId });

    if (!cart) {
        cart = await Cart.create({
            cartId,
            items: [
                {
                    product: productId,
                    quantity
                }
            ]
        });
    } else {
        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (item) {
            const newQuantity = item.quantity + quantity;

            if (newQuantity > product.countInStock) {
                return res.status(400).json({
                    status: httpStatusText.FAIL,
                    message: 'Not enough stock',
                    data: null
                });
            }

            item.quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity
            });
        }

        await cart.save();
    }

    await populateCart(cart);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: formatCartResponse(cart, cartId)
    });
};

const updateCartItem = async (req, res) => {
    const { productId, quantity } = req.body;

    if (quantity < 1) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Quantity must be at least 1',
            data: null
        });
    }

    const cartId = getCartId(req, res);

    const cart = await Cart.findOne({ cartId });

    if (!cart) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Cart not found',
            data: null
        });
    }

    const item = cart.items.find(
        item => item.product.toString() === productId
    );

    if (!item) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Product not found in cart',
            data: null
        });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Product not found',
            data: null
        });
    }

    if (quantity > product.countInStock) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Not enough stock',
            data: null
        });
    }

    item.quantity = quantity;

    await cart.save();
    await populateCart(cart);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: formatCartResponse(cart, cartId)
    });
};

const removeFromCart = async (req, res) => {
    const { productId } = req.params;

    const cartId = getCartId(req, res);

    const cart = await Cart.findOne({ cartId });

    if (!cart) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'Cart not found',
            data: null
        });
    }

    cart.items = cart.items.filter(
        item => item.product.toString() !== productId
    );

    await cart.save();
    await populateCart(cart);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: formatCartResponse(cart, cartId)
    });
};

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
};