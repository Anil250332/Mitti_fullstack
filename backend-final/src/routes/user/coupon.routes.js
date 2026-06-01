const express = require("express");
const router = express.Router();
const couponController = require("../../controllers/user/coupon.controller");

router.get("/available", couponController.getAvailableCoupons);
router.post("/apply", couponController.applyCoupon);

module.exports = router;
