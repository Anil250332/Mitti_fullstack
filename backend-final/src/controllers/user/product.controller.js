const Sequelize = require("../../config/db");
const { Op } = require("sequelize");
const { Product, ProductImage, ProductTag, ProductWeight, Category, SubCategory, Weight, Tag } = require("../../models");

exports.getBestSellerProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        IsBestSeller: true,
        IsActive: true
      },
      attributes: [
        "id",
        "name",
        "Rating",
        "Price",
        "DiscountPrice",
        "Weight"
      ],
      include: [
        { model: ProductImage, attributes: ["Path", "GUID", "eExtension"] }
      ],
      order: [[Product.sequelize.literal("Position"), "ASC"]]
    });

    const response = products.map(product => ({
      id: product.id,
      name: product.name,
      rating: product.Rating,
      price: product.Price,
      discountedPrice: product.DiscountPrice,
      weight: product.Weight,
      image: product.ProductImages?.[0]?.Path || null
    }));

    return res.status(200).json({ success: true, count: response.length, data: response });

  } catch (error) {

    return res.status(500).json({ success: false, message: "Failed to fetch best seller products" });
  }
};

/**
 * Get all categories
 */
exports.getCategories = async (req, res) => {
  try {
    const data = await Category.findAll({ order: [["category", "ASC"]] });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * Get subcategories (optionally filtered by categoryId)
 */
exports.getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const where = categoryId ? { CategoryId: categoryId } : {};
    const data = await SubCategory.findAll({
      where,
      include: [{ model: Category, attributes: ["id", "category"] }],
      order: [["name", "ASC"]]
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * Get all weights
 */
exports.getWeights = async (req, res) => {
  try {
    const weights = await Product.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("Weight")), "weight"]
      ],
      where: {
        Weight: {
          [Op.ne]: null
        }
      },
      order: [["Weight", "ASC"]]
    });

    const data = weights
      .map(w => w.dataValues.weight)
      .filter(w => w && w.trim() !== "")
      .map(w => ({ id: w, weight: w }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * Get all tags
 */
exports.getTags = async (req, res) => {
  try {
    const data = await Tag.findAll({ order: [["tag", "ASC"]] });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * Get min & max product price
 */
exports.getMinMaxPrice = async (req, res) => {
  try {
    const result = await Product.findOne({
      attributes: [
        [Product.sequelize.fn("MIN", Product.sequelize.col("price")), "minPrice"],
        [Product.sequelize.fn("MAX", Product.sequelize.col("price")), "maxPrice"]
      ]
    });

    res.json({
      success: true,
      minPrice: result.get("minPrice") || 0,
      maxPrice: result.get("maxPrice") || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

