const { Coupon } = require("../../models");
const { Sequelize, Op } = require("sequelize");

/**
 * Get available coupons for users (displayed on Offers page)
 */
exports.getAvailableCoupons = async (req, res) => {
    try {
        const { isOnlineOnly } = req.query;
        const now = new Date();
        
        const whereClause = {
            isActive: true,
            [Op.or]: [
                { startDate: null },
                { startDate: { [Op.lte]: now } }
            ],
            expiryDate: { [Op.gte]: now },
            [Op.or]: [
                { usageLimit: null },
                { usageCount: { [Op.lt]: Sequelize.col('usageLimit') } }
            ]
        };

        if (isOnlineOnly !== undefined) {
            if (isOnlineOnly === 'true') {
                // If order contains online-only products, only online coupons are valid
                whereClause.isOnlineAllowed = true;
            } else {
                // If order is flexible, show both (Online and COD allowed coupons)
                // We'll let the frontend label them.
                // No strict filtering by type here, but ensuring it allows AT LEAST one of them (which is default)
                whereClause[Op.or] = [
                    { isCodAllowed: true },
                    { isOnlineAllowed: true }
                ];
            }
        }

        const coupons = await Coupon.findAll({
            where: whereClause,
            order: [["createdAt", "DESC"]]
        });
        return res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error !!" });
    }
};

/**
 * Apply coupon and validate
 */
exports.applyCoupon = async (req, res) => {
    try {
        const { code, orderAmount, isOnlineOnly } = req.body;

        if (!code || !orderAmount) {
            return res.status(400).json({ success: false, message: "Coupon code and order amount are required" });
        }

        const now = new Date();
        const coupon = await Coupon.findOne({
            where: {
                code,
                isActive: true,
                [Op.or]: [
                    { startDate: null },
                    { startDate: { [Op.lte]: now } }
                ],
                expiryDate: { [Op.gte]: now }
            }
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid or expired coupon code" });
        }

        // Check payment method compatibility
        if (isOnlineOnly !== undefined && isOnlineOnly === 'true') {
            // If order contains online-only products, only online coupons are valid
            if (!coupon.isOnlineAllowed) {
                return res.status(400).json({ success: false, message: "This coupon is only for COD orders" });
            }
        }
        // If order is flexible (isOnlineOnly=false), we allow applying any coupon (Online or COD)
        // because the user can change their payment method to Online if needed.

        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
        }

        // Check minimum order amount
        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
        }

        let discountAmount = 0;
        if (coupon.type === "percentage") {
            discountAmount = (orderAmount * coupon.value) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else {
            discountAmount = coupon.value;
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount > orderAmount) {
            discountAmount = orderAmount;
        }

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            data: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discountAmount: Number(discountAmount).toFixed(2),
                minOrderAmount: coupon.minOrderAmount,
                finalAmount: (orderAmount - discountAmount).toFixed(2)
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error !!" });
    }
};
