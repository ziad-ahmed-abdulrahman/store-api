import rateLimit from 'express-rate-limit';

const rateLimiter = (seconds, limit) => {
    return rateLimit({
        windowMs: seconds * 1000,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many requests, please try again later.'
        }
    });
};

export default rateLimiter;