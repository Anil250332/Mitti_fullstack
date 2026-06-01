const { Review, Product } = require("../../models");

// Admin Controller
exports.addReview = async (req, res) => {
    try {
        const { productId, customerName, rating, description } = req.body;
        const customerImage = req.file ? `uploads/${req.file.filename}` : null;

        const review = await Review.create({
            productId,
            customerName,
            customerImage,
            rating,
            description
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Review.findAndCountAll({
            include: [{ model: Product, attributes: ['name'] }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await Review.destroy({ where: { id } });
        res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// User Controller
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4; // Display 4 reviews per page
        const offset = (page - 1) * limit;

        const { count, rows } = await Review.findAndCountAll({
            where: { productId, isActive: true },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
