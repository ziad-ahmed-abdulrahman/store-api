import bcrypt from 'bcrypt';
import Category from './models/category.js';
import Product from './models/product.js';
import User from './models/user.js';

const categories = [
    {
        name: 'Electronics',
        description: 'Electronic devices, gadgets, and accessories.'
    },
    {
        name: 'Clothes',
        description: 'Clothing, fashion items, and accessories.'
    },
    {
        name: 'Shoes',
        description: 'Different types of shoes for men, women, and children.'
    },
    {
        name: 'Books',
        description: 'Books, novels, educational materials, and publications.'
    },
    {
        name: 'Sports',
        description: 'Sports equipment, gear, and fitness accessories.'
    }
];

const seedDatabase = async () => {
    for (const category of categories) {
        const exists = await Category.findOne({
            name: category.name
        });

        if (!exists) {
            await Category.create(category);
        }
    }

    console.log('Categories checked successfully');

    const electronics = await Category.findOne({
        name: 'Electronics'
    });

    const clothes = await Category.findOne({
        name: 'Clothes'
    });

    const shoes = await Category.findOne({
        name: 'Shoes'
    });

    const books = await Category.findOne({
        name: 'Books'
    });

    const sports = await Category.findOne({
        name: 'Sports'
    });

    const products = [
        {
            name: 'iPhone 17',
            description: 'Latest Apple smartphone',
            price: 50000,
            category: electronics._id,
            images: [
                '/uploads/products/iphone17-1.jpg'
            ],
            brand: 'Apple',
            countInStock: 20,
            rating: 4.8,
            numReviews: 120,
            isFeatured: true
        }
    ];

    for (const product of products) {
        const exists = await Product.findOne({
            name: product.name
        });

        if (!exists) {
            await Product.create(product);
        }
    }

    console.log('Products checked successfully');

    const adminEmail = process.env.ADMIN_EMAIL;

    const adminExists = await User.findOne({
        email: adminEmail
    });

    if (!adminExists) {
        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

        await User.create({
            firstName: 'Ziad',
            lastName: 'Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        console.log('Admin created successfully');
    } else {
        console.log('Admin already exists');
    }
};

export default seedDatabase;