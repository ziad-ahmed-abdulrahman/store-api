import User from '../models/user.js';
import httpStatusText from '../utils/httpStatusText.js';
import sendEmail from '../services/emailService.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';


const register = async (req, res) => {
    const existingUser = await User.exists({ email: req.body.email });

    if (existingUser) {
        return res.status(409).json({
            status: httpStatusText.FAIL,
            message: 'Email already exists'
        });
    }

    let userData = { ...req.body };

    userData.password = await bcrypt.hash(userData.password, 10);

    const user = await User.create(userData);

    await sendEmail(
        user.email,
        'Account Created Successfully',
        `Hello ${user.firstName},

Your account has been created successfully.

Please activate your account before logging in.

Thank you.
`
    );

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        },
        message: 'Account created successfully. Please activate your account before logging in.'
    });
};

const login = async (req, res) => {
    const user = await User
        .findOne({ email: req.body.email })
        .select('+password +role');

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'User not found'
        });
    }

    const isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        user.password
    );

    if (!isPasswordCorrect) {
        return res.status(401).json({
            status: httpStatusText.FAIL,
            message: 'Invalid email or password'
        });
    }

    const expiresInMinutes = Number(process.env.JWT_EXPIRES_IN_MINUTES);
    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: `${expiresInMinutes}m`
        }
    )

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: { token: token }
    });
};

const sendActivationCode = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'User not found'
        });
    }

    if (user.isVerified) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Account is already activated'
        });
    }

    const code = randomInt(100000, 1000000).toString();

    const hashedCode = await bcrypt.hash(code, 10);

    user.code = hashedCode;
    user.codeOperation = 'activation';
    user.codeExpiresAt = new Date(
        Date.now() + Number(process.env.OTP_EXPIRES_IN_SECONDS) * 1000
    );

    await user.save();

    const otpExpiresIn = Number(process.env.OTP_EXPIRES_IN_SECONDS);

    await sendEmail(
        user.email,
        'Account Activation',
        `Your activation code is: ${code}

This code is valid for ${otpExpiresIn / 60} minutes.
`
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Activation code sent successfully'
    });
};


const activate = async (req, res) => {
    const { email, code } = req.body;

    const user = await User
        .findOne({ email })
        .select('+code +codeOperation +codeExpiresAt');

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'User not found'
        });
    }

    if (user.isVerified) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Account is already activated'
        });
    }

    if (user.codeOperation !== 'activation') {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid code operation'
        });
    }

    if (
        !user.code ||
        !user.codeExpiresAt ||
        user.codeExpiresAt < new Date()
    ) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Code is expired or invalid'
        });
    }

    const isValidCode = await bcrypt.compare(
        code,
        user.code
    );

    if (!isValidCode) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid activation code'
        });
    }

    user.isVerified = true;

    user.code = undefined;
    user.codeOperation = undefined;
    user.codeExpiresAt = undefined;

    await user.save();

    await sendEmail(
        user.email,
        'Account Activated',
        `Hello ${user.firstName},

Your account has been activated successfully.

You can now log in to your account.`
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Account activated successfully'
    });
};

const sendForgetPasswordCode = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'User not found'
        });
    }

    const code = randomInt(100000, 1000000).toString();

    const hashedCode = await bcrypt.hash(code, 10);

    user.code = hashedCode;
    user.codeOperation = 'forget-password';

    user.codeExpiresAt = new Date(
        Date.now() +
        Number(process.env.OTP_EXPIRES_IN_SECONDS) * 1000
    );

    await user.save();

    const otpExpiresIn = Number(process.env.OTP_EXPIRES_IN_SECONDS);

    await sendEmail(
        user.email,
        'Reset Password',
        `Your password reset code is: ${code}

This code is valid for ${otpExpiresIn / 60} minutes.`
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Password reset code sent successfully'
    });
};

const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    const user = await User
        .findOne({ email })
        .select('+code +codeOperation +codeExpiresAt +password');

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            message: 'User not found'
        });
    }

    if (user.codeOperation !== 'forget-password') {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid code operation'
        });
    }

    if (
        !user.code ||
        !user.codeExpiresAt ||
        user.codeExpiresAt < new Date()
    ) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Code is expired or invalid'
        });
    }

    const isValidCode = await bcrypt.compare(
        code,
        user.code
    );

    if (!isValidCode) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid reset code'
        });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.code = undefined;
    user.codeOperation = undefined;
    user.codeExpiresAt = undefined;

    await user.save();

    await sendEmail(
        user.email,
        'Password Reset Successful',
        `Hello ${user.firstName},

Your password has been reset successfully.

If you did not perform this action, please contact support immediately.`
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Password reset successfully'
    });
};

export {
    register,
    login,
    sendActivationCode,
    activate,
    sendForgetPasswordCode,
    resetPassword
};

