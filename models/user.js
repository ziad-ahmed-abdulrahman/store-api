import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        select: false
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    code: {
        type: String,
        select: false
    },

    codeOperation: {
        type: String,
        enum: ['activation', 'forget-password', 'change-password'],
        select: false
    },

    codeExpiresAt: {
        type: Date,
        select: false
    }
});

export default mongoose.model('User', userSchema);