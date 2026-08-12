import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
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
        }
    },
    {
        _id: false
    }
);

const cartSchema = new mongoose.Schema(
    {
        cartId: {
            type: String,
            required: true,
            unique: true
        },

        items: [cartItemSchema]
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Cart', cartSchema);