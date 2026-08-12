import Product from '../models/product.js';
import httpStatusText from '../utils/httpStatusText.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { deleteFile } from '../services/fileService.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const getAllProducts = async (req, res) => {
    const {
        search,
        category,
        page = 1,
        limit = 10,
        sort = 'name'
    } = req.query;

    const filter = {};

    if (search) {
        filter.name = {
            $regex: search,
            $options: 'i'
        };
    }

    if (category) {
        filter.category = category;
    }

    const pageNumber = Math.max(Number(page), 1);

    const limitNumber = Math.min(
        Math.max(Number(limit), 1),
        100
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [products, totalProducts] = await Promise.all([
        Product.find(
            filter,
            {
                __v: false
            }
        )
            .sort(sort)
            .skip(skip)
            .limit(limitNumber),

        Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(
        totalProducts / limitNumber
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: products,
        pagination: {
            currentPage: pageNumber,
            limit: limitNumber,
            totalProducts,
            totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
        }
    });
};

const getSingleProduct = async (req, res) => {
    const product = await Product
        .findById(req.params.id, { __v: false });



    if (!product)
        return res.status(404).json({
            status: httpStatusText.FAIL, data: null
        });

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: product
    });
};


const createProduct = async (req, res) => {
    const images = req.files?.map(
        file => `/uploads/products/${file.filename}`
    ) || [];

    const product = await Product.create({
        ...req.body,
        images
    });

    const productData = product.toObject();
    delete productData.__v;

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: productData
    });
};

const editProduct = async (req, res) => {
    let product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            returnDocument: 'after',
            projection: {
                __v: false
            }
        }

    );

    if (!product)
        return res.status(404).json({
            status: httpStatusText.FAIL, data: null
        });

    return res.status(200).json({
        status: httpStatusText.SUCCESS, data: product
    });
};

const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            status: httpStatusText.FAIL,
            data: null
        });
    }

    for (const image of product.images) {
        const imagePath = path.join(
            __dirname,
            '..',
            image.replace(/^[/\\]/, '')
        );
        await deleteFile(imagePath);
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: null
    });
};

export {
    getAllProducts,
    getSingleProduct,
    createProduct,
    editProduct,
    deleteProduct
};

