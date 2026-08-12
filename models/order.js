import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: items => items.length > 0,
                message: 'Order must contain at least one item'
            }
        },

        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: [
                'pending',
                'payment_pending',
                'paid',
                'cancelled',
                'payment_failed'
            ],
            default: 'pending'
        },

        paymentIntentId: {
            type: String,
            default: null
        },

        clientSecret: {
            type: String,
            default: null
        },

        paymentTransactionId: {
            type: String,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },

        shippingAddress: {
            type: String,
            required: true,
            trim: true
        },

        phoneNumber: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Order', orderSchema);