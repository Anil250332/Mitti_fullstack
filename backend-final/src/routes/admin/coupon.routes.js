const express = require("express");
const router = express.Router();
const couponController = require("../../controllers/admin/coupon.controller");

const checkPermission = require("../../middlewares/permission");

router.get("/", checkPermission("coupons"), couponController.getAllCoupons);
router.post("/add", checkPermission("coupons"), couponController.createCoupon);
router.put("/update/:id", checkPermission("coupons"), couponController.updateCoupon);
router.delete("/delete/:id", checkPermission("coupons"), couponController.deleteCoupon);

module.exports = router;
