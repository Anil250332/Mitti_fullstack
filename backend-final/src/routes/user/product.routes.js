const express = require("express");
const router = express.Router();

const {
  getBestSellerProducts,
  getCategories,
  getSubCategories,
  getWeights,
  getTags,
  getMinMaxPrice
} = require("../../controllers/user/product.controller");
const { getProducts, getProductDetails } = require("../../controllers/user/frontend.controller");

const reviewController = require("../../controllers/admin/review.controller");

router.get("/best-sellers", getBestSellerProducts);
router.get("/categories", getCategories);
router.get("/subcategories", getSubCategories);
router.get("/weights", getWeights);
router.get("/tags", getTags);
router.get("/min-max-price", getMinMaxPrice);
router.get("/product-details", getProductDetails);
router.get("/reviews/:productId", reviewController.getProductReviews);
router.get("/", getProducts);

module.exports = router;