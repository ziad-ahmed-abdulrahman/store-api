import Category from '../models/category.js';
import httpStatusText from '../utils/httpStatusText.js';

const getAllCategories = async (req, res) => {
    const categoriesList = await Category.find({}, { __v: false });

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: categoriesList
    });
};

const getSingleCategory = async (req, res) => {
    const category = await Category.findById(req.params.id, { __v: false });

    if (!category)
        return res.status(404).json({
            status: httpStatusText.FAIL, data: null
        });

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: category
    });
};


const createCategory = async (req, res) => {
    const category = await Category.create(req.body);

    const categoryData = category.toObject();
    delete categoryData.__v;

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: categoryData
    });
};

const editCategory = async (req, res) => {
    let category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            returnDocument: 'after',
            projection: {
                __v: false
            }
        }

    );

    if (!category)
        return res.status(404).json({
            status: httpStatusText.FAIL, data: null
        });

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: category
    });
};

const deleteCategory = async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category)
        return res.status(404).json({
            status: httpStatusText.FAIL, data: null
        });

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: null
    });
};

export {
    getAllCategories,
    getSingleCategory,
    createCategory,
    editCategory,
    deleteCategory
};

