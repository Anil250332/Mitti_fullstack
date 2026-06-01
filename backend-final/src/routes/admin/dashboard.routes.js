const router = require("express").Router();


const { getDashboardCounts, getTopSellingProducts, getTopCustomers, getOrderStatistics } = require("../../controllers/admin/dashboard.controller");

const checkPermission = require("../../middlewares/permission");

router.get("/counts", checkPermission("home"), getDashboardCounts);
router.get("/statistics", checkPermission("home"), getOrderStatistics);
router.get("/top-products", checkPermission("home"), getTopSellingProducts);
router.get("/top-customers", checkPermission("home"), getTopCustomers);

module.exports = router;
