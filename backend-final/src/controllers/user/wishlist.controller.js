const {
  ProductWishlist,
  Product,
  ProductImage,
  User
} = require("../../models");

const { extractToken } = require("../../config/jwt");

/**
 * ADD TO WISHLIST
 */
exports.addToWishlist = async (req, res) => {
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

    const productId = req.params.productId || req.body.productId;

    if (!productId)
      return res.status(400).json({ success: false, message: "ProductId is required" });

    const exists = await ProductWishlist.findOne({ where: { userId, productId } });

    if (exists)
      return res.status(200).json({ success: true, message: "Product already in wishlist" });

    await ProductWishlist.create({ userId, productId });

    return res.status(201).json({ success: true, message: "Product added to wishlist" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * REMOVE FROM WISHLIST
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;
    const { productId } = req.params;

    await ProductWishlist.destroy({
      where: {
        userId,
        productId
      }
    });

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET USER WISHLIST
 */
exports.getWishlist = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    const wishlist = await ProductWishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          attributes: [
            "id", "name", "Price", "DiscountPrice", "SubTitle",
            "PiecesPerJar", "MRPPerJar", "MRPPerPiece", "PacketsPerJar",
            "PiecesPerJarLabel", "MRPPerJarLabel", "MRPPerPieceLabel", "PacketsPerJarLabel"
          ],
          include: [
            {
              model: ProductImage,
              attributes: ["Path"],
              limit: 1
            }
          ]
        }
      ],
      order: [["id", "DESC"]]
    });


    const data = wishlist.map((item, index) => {
      if (!item.Product) {
        return null;
      }

      const p = item.Product;
      const originalPrice = p.Price ?? 0;
      const offerPrice = p.DiscountPrice ?? null;
      const hasDiscount = offerPrice && Number(offerPrice) < Number(originalPrice);

      return {
        wishlistId: item.id,
        productId: p.id,
        name: p.name,
        price: hasDiscount ? offerPrice : originalPrice,
        oldPrice: hasDiscount ? originalPrice : null,
        subTitle: p.SubTitle ?? "",
        piecesPerJar: p.PiecesPerJar ?? "",
        mrpPerJar: p.MRPPerJar ?? "",
        mrpPerPiece: p.MRPPerPiece ?? "",
        packetsPerJar: p.PacketsPerJar ?? "",
        piecesPerJarLabel: p.PiecesPerJarLabel ?? "No. of Pieces/Jar",
        mrpPerJarLabel: p.MRPPerJarLabel ?? "MRP of Jar",
        mrpPerPieceLabel: p.MRPPerPieceLabel ?? "Per Piece MRP",
        packetsPerJarLabel: p.PacketsPerJarLabel ?? "CTN Size",
        image: p.ProductImages?.[0]?.Path || null
      };
    }).filter(Boolean);

    return res.status(200).json({ success: true, count: data.length, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};