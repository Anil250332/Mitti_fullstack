const { Coupon } = require("../../models");

/**
 * Get all coupons
 */
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({
            order: [["createdAt", "DESC"]]
        });
        return res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error !!" });
    }
};

/**
 * Create a new coupon
 */
exports.createCoupon = async (req, res) => {
    try {
        const { code, type, value, minOrderAmount, maxDiscountAmount, startDate, expiryDate, usageLimit, isActive, isCodAllowed, isOnlineAllowed } = req.body;

        if (!code || !type || !value || !expiryDate) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const existing = await Coupon.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ success: false, message: "Coupon code already exists" });
        }

        const coupon = await Coupon.create({
            code,
            type,
            value,
            minOrderAmount,
            maxDiscountAmount,
            startDate,
            expiryDate,
            usageLimit,
            isActive,
            isCodAllowed: isCodAllowed !== undefined ? isCodAllowed : true,
            isOnlineAllowed: isOnlineAllowed !== undefined ? isOnlineAllowed : true
        });

        return res.status(201).json({ success: true, message: "Coupon created successfully", data: coupon });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error !!" });
    }
};

/**
 * Update a coupon
 */
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, type, value, minOrderAmount, maxDiscountAmount, startDate, expiryDate, usageLimit, isActive, isCodAllowed, isOnlineAllowed } = req.body;

        const coupon = await Coupon.findByPk(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        if (code && code !== coupon.code) {
            const existing = await Coupon.findOne({ where: { code } });
            if (existing) {
                return res.status(400).json({ success: false, message: "Coupon code already exists" });
            }
        }

        await coupon.update({
            code,
            type,
            value,
            minOrderAmount,
            maxDiscountAmount,
            startDate,
            expiryDate,
            usageLimit,
            isActive,
            isCodAllowed: isCodAllowed !== undefined ? isCodAllowed : coupon.isCodAllowed,
            isOnlineAllowed: isOnlineAllowed !== undefined ? isOnlineAllowed : coupon.isOnlineAllowed
        });

        return res.status(200).json({ success: true, message: "Coupon updated successfully", data: coupon });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error !!" });
    }
};

/**
 * Delete a coupon
 */
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByPk(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        await coupon.destroy();
        return res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error !!" });
    }
};
