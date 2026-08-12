const adminMiddleware = (req, res, next) => {

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'fail',
            message: 'Access denied. Admin only'
        });
    }

    next();
};

export default adminMiddleware;