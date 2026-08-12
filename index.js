import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import categoryRouter from "./routes/category.js";
import productRouter from "./routes/product.js";
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import cartRouter from './routes/cart.js';
import orderRouter from './routes/order.js';
import httpStatusText from './utils/httpStatusText.js';
import dns from 'node:dns';
import mongoose from 'mongoose';
import seedDatabase from './seed.js';

dotenv.config();


dns.setServers(['1.1.1.1']);

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);


app.use((req, res) => {
    return res.status(404).json({
        status: httpStatusText.ERROR,
        message: `Route ${req.originalUrl} not found`,
        data: null,
        code: 404
    });
});

try {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: 'StoreApi'
    });
    await seedDatabase();
} catch (error) {
    console.log("connection error : ", error.message);
}

app.use((err, req, res, next) => {
    return res.status(500).json({
        status: httpStatusText.ERROR,
        message: err.message,
        data: null,
        code: 500
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on port ${process.env.PORT || 3000}`);
});