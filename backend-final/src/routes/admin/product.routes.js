const express = require("express");
const router = express.Router();

const upload = require("../../config/multer");

const {
  getAllProducts,
  getProductById,
  saveProduct,
  deleteProduct,
  changeStatusProduct,
  updateProductActiveStatus,
  setBestSellerProduct,
  toggleOnlinePaymentOnly,
  getLowStockProducts,
  updateProductStock
} = require("../../controllers/admin/product.controller");

const checkPermission = require("../../middlewares/permission");

// ADMIN PRODUCT ROUTES
router.post("/save", checkPermission("products"), upload.array("images", 10), saveProduct);
router.post("/changeStatus", checkPermission("products"), changeStatusProduct);
router.post("/setBestSeller", checkPermission("products"), setBestSellerProduct);
router.post("/toggleOnlinePaymentOnly", checkPermission("products"), toggleOnlinePaymentOnly);
router.get("/low-stock", checkPermission("products"), getLowStockProducts);
router.patch("/:id/stock", checkPermission("products"), updateProductStock);
router.patch("/:id/status", checkPermission("products"), updateProductActiveStatus);
router.get("/", checkPermission("products"), getAllProducts);
router.get("/:id", checkPermission("products"), getProductById);
router.delete("/:id", checkPermission("products"), deleteProduct);

module.exports = router;
