import User from '../models/user.js';
import sendEmail from '../services/emailService.js';
import httpStatusText from '../utils/httpStatusText.js';
import bcrypt from 'bcrypt';


const getMe = async (req, res) => {
    const user = await User.findById(
        req.user.id,
        {
            __v: false
        }
    );

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: user
    });
};


const editMe = async (req, res) => {
    const { firstName, lastName } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user.id,
        {
            firstName,
            lastName
        },
        {
            returnDocument: 'after',
            runValidators: true,
            projection: {
                __v: false
            }
        }
    );

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: user
    });
};

const deleteMe = async (req, res) => {
    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null
    });
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    const isPasswordCorrect = await bcrypt.compare(
        oldPassword,
        user.password
    );

    if (!isPasswordCorrect) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Old password is incorrect',
            data: null
        });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    await sendEmail(
        user.email,
        'Password Changed Successfully',
        `Hello ${user.firstName},

Your password has been changed successfully.

If you did not make this change, please contact support immediately.
`
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Password changed successfully',
        data: null
    });
};

const getAllUsers = async (req, res) => {

    const {
        search,
        role,
        page = 1,
        limit = 10,
        sort = 'firstName'
    } = req.query;

    const filter = {};

    if (search) {
        filter.$or = [
            {
                firstName: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
                lastName: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
                email: {
                    $regex: search,
                    $options: 'i'
                }
            }
        ];
    }

    if (role) {
        filter.role = role;
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
        Math.max(Number(limit), 1),
        100
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [users, totalUsers] = await Promise.all([

        User.find(
            filter,
            {
                __v: false
            }
        )
            .sort(sort)
            .skip(skip)
            .limit(limitNumber),

        User.countDocuments(filter)

    ]);

    const totalPages = Math.ceil(
        totalUsers / limitNumber
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,

        data: users,

        pagination: {
            currentPage: pageNumber,
            limit: limitNumber,
            totalUsers,
            totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
        }
    });
};


const getSingleUser = async (req, res) => {
    const user = await User.findById(
        req.params.id,
        {
            __v: false
        }
    );

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: user
    });
};


const createUser = async (req, res) => {

    const { firstName, lastName, email, password, role, isVerified } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        isVerified
    });

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified
        }
    });
};;


const editUser = async (req, res) => {

    const updateData = { ...req.body };

    if (updateData.password) {
        updateData.password = await bcrypt.hash(
            updateData.password,
            10
        );
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: user
    });
};


const deleteUser = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null
    });
};


export {
    getMe,
    editMe,
    deleteMe,
    changePassword,
    getAllUsers,
    getSingleUser,
    createUser,
    editUser,
    deleteUser
};