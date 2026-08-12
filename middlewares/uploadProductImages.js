import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/products');
    },

    filename: (req, file, cb) => {
        const productName = req.body.name
            .trim()
            .replace(/\s+/g, '-');

        const extension = path.extname(file.originalname);

        cb(
            null,
            `${productName}-${Date.now()}${extension}`
        );
    }
});

const uploadProductImages = multer({
    storage
});

export default uploadProductImages;