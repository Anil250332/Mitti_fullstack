const express = require("express");
const router = express.Router();

const { addToWishlist, removeFromWishlist, getWishlist } = require("../../controllers/user/wishlist.controller");

// const { authenticate } = require("../middlewares/auth.middleware");

// CUSTOMER WISHLIST ROUTES
router.post("/add/:productId", addToWishlist);
router.get("/", getWishlist);
router.delete("/remove/:productId", removeFromWishlist);

module.exports = router;

