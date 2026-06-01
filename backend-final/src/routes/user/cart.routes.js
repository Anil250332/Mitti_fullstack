const express = require("express");
const router = express.Router();

const { addToCart, removeFromCart, getCartItems, clearCart } = require("../../controllers/user/cart.controller");

// USER CART ROUTES
router.post("/add", addToCart);
router.delete("/clear", clearCart);
router.delete("/remove/:productId", removeFromCart);
router.get("/", getCartItems);

module.exports = router;
