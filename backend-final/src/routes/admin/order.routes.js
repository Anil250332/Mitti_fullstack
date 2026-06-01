const router = require("express").Router();

const { 
  placeOrder, getMyOrders, getAllOrders, updateOrderStatus, 
  updateOrderPayment, getPendingProductQty, getOrderStatusCounts, 
  getPendingProductOrders, updateOrderItems, getOrderDetails, 
  downloadInvoice, getOrderTracking, getShippingCharges,
  approveOrder, testNimbus 
} = require("../../controllers/admin/order.controller");

const checkPermission = require("../../middlewares/permission");

const upload = require("../../config/multer");
router.post("/save", upload.single("paymentSlip"), placeOrder);
router.get("/", getMyOrders);
router.get("/getall", checkPermission("orders"), getAllOrders);
router.get("/details/:id", getOrderDetails);
router.get("/invoice/:id", downloadInvoice);
router.post("/update-status", checkPermission("orders"), updateOrderStatus);
router.post("/update-payment", checkPermission("orders"), updateOrderPayment);
router.post("/update-items", checkPermission("orders"), updateOrderItems);
router.get("/order-product-qty", checkPermission("orders"), getPendingProductQty);

router.get("/order-product-orders", checkPermission("orders"), getPendingProductOrders);
router.get("/order-status-counts", checkPermission("orders"), getOrderStatusCounts);
router.get("/tracking/:id", getOrderTracking);
router.post("/shipping-charges", getShippingCharges);

// New Nimbus Routes
router.put("/:id/approve", checkPermission("orders"), approveOrder);
router.get("/test-nimbus", testNimbus);

module.exports = router;
