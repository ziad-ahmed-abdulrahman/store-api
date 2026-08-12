import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
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
        trim: true,
        minlength: 10,
        maxlength: 500
    },


});

export default mongoose.model('Category', categorySchema);