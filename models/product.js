import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },

    images: [{
        type: String
    }],

    brand: {
        type: String,
        default: ''
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
    },

    rating: {
        type: Number,
        default: 0
    },

    numReviews: {
        type: Number,
        default: 0
    },

    isFeatured: {
        type: Boolean,
        default: false
    },

    dateCreated: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Product', productSchema);