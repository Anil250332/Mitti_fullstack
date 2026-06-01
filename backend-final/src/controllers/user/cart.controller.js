const {
  CartItem,
  Product,
  ProductImage,
  User
} = require("../../models");

const { extractToken } = require("../../config/jwt");

/**
 * ADD PRODUCT TO CART
 */
exports.addToCart = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    // Safety check: ensure user exists to avoid FK constraint error
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found or session expired." });
    }

    const { productId, quantity } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: "ProductId is required" });

    const qty = quantity ? Number(quantity) : 1;

    // Prevent duplicate cart item
    const exists = await CartItem.findOne({
      where: {
        userId,
        productId
      }
    });

    if (exists) {
      exists.quantity = qty;
      await exists.save();
      return res.status(200).json({ success: true, message: "Cart updated" });
    }

    await CartItem.create({ userId, productId, quantity: qty });

    return res.status(201).json({ success: true, message: "Product added to cart" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * REMOVE PRODUCT FROM CART
 */
exports.removeFromCart = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;
    const { productId } = req.params;

    await CartItem.destroy({
      where: {
        userId,
        productId
      }
    });

    return res.status(200).json({ success: true, message: "Product removed from cart" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL CART ITEMS
 */
exports.getCartItems = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          required: true,
          attributes: ["id", "name", "Price", "DiscountPrice", "PacketsPerJar", "isOnlinePaymentOnly"],
          include: [
            {
              model: ProductImage,
              attributes: ["Path"]
            }
          ]
        }
      ],
      order: [["id", "DESC"]]
    });

    const data = cartItems
      .filter((item) => item?.Product)
      .map(item => {
        const prod = item.Product;
        const finalPrice = (prod.DiscountPrice && Number(prod.DiscountPrice) < Number(prod.Price))
          ? prod.DiscountPrice
          : prod.Price;

        return {
          productId: prod.id,
          productName: prod.name,
          price: finalPrice,
          originalPrice: prod.Price,
          hasDiscount: !!(prod.DiscountPrice && Number(prod.DiscountPrice) < Number(prod.Price)),
          quantity: item.quantity,
          image: item.Product.ProductImages?.[0]?.Path || null,
          packetsPerJar: prod.PacketsPerJar || 1, // Default to 1 if not set
          isOnlinePaymentOnly: prod.isOnlinePaymentOnly ?? false
        };
      });

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CLEAR ALL CART ITEMS
 */
exports.clearCart = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    await CartItem.destroy({
      where: { userId }
    });

    return res.status(200).json({ success: true, message: "Cart cleared successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};