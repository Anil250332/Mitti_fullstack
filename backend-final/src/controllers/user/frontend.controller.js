const { Op } = require("sequelize");
const { Product, ProductImage, ProductTag, ProductWeight, Weight, Tag } = require("../../models");

/**
 * CUSTOMER PRODUCT LISTING (NO LOGIN)
 */
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, search, categoryId, subCategoryId, tagIds, weightIds, minPrice, maxPrice, pieces } = req.query;

    const limit = 12;
    const offset = (page - 1) * limit;

    const whereCondition = { IsActive: true };
    const include = [];

    // Search by product name
    if (search)
      whereCondition.name = { [Op.like]: `%${search}%` };

    // SubCategory filter (takes priority over category)
    if (subCategoryId !== undefined && subCategoryId !== null && subCategoryId !== 'all') {
      const sId = parseInt(subCategoryId, 10);
      whereCondition.SubCategoryId = !isNaN(sId) ? sId : -1;
    } else if (categoryId !== undefined && categoryId !== null && categoryId !== 'all') {
      const cId = parseInt(categoryId, 10);
      whereCondition.CategoryId = !isNaN(cId) ? cId : -1;
    }

    // Filter by PiecesPerJar
    if (pieces) {
      whereCondition.PiecesPerJar = {
        [Op.in]: pieces.split(",")
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereCondition.Price = {};
      if (minPrice !== undefined) whereCondition.Price[Op.gte] = Number(minPrice);
      if (maxPrice !== undefined) whereCondition.Price[Op.lte] = Number(maxPrice);
    }

    if (tagIds) {
      include.push({
        model: ProductTag,
        required: true,
        where: {
          TagId: {
            [Op.in]: tagIds.split(",")
          }
        },
        include: [{ model: Tag }]
      });
    }

    if (weightIds) {
      whereCondition.Weight = {
        [Op.in]: weightIds.split(",")
      };
    }

    include.push({ model: ProductImage, attributes: ["Path"] });

    const { rows, count } = await Product.findAndCountAll({
      where: whereCondition,
      include,
      distinct: true,
      limit,
      offset,
      order: [[Product.sequelize.literal("Position"), "ASC"], ["name", "ASC"]],
      attributes: ["id", "name", "Price", "DiscountPrice", "Position", "Weight", "IsActive", "CategoryId", "SubCategoryId", "Rating", "isOnlinePaymentOnly"]
    });

    const products = rows.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.Price || 0),
      discountedPrice: Number(p.DiscountPrice || 0),
      weight: p.Weight,
      rating: p.Rating,
      categoryId: p.CategoryId,
      subCategoryId: p.SubCategoryId,
      image: p.ProductImages?.[0]?.Path || null,
      isOnlinePaymentOnly: p.isOnlinePaymentOnly ?? false
    }));

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        totalProducts: count,
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        perPage: limit
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CUSTOMER PRODUCT DETAILS (NO LOGIN)
 */
exports.getProductDetails = async (req, res) => {
  try {
    const id = req.params?.id || req.query?.id;

    if (!id)
      return res.status(400).json({ success: false, message: "Product id is required" });

    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductImage,
          attributes: ["id", "Path"]
        },
        {
          model: ProductWeight,
          include: [{ model: Weight, attributes: ["id", "weight"] }]
        },
        {
          model: ProductTag,
          include: [{ model: Tag, attributes: ["id", "tag"] }]
        }
      ]
    });

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });


    const dietTypeMap = {
      1: "VEG",
      2: "NON_VEG",
      3: "VEGAN",
      4: "SUGARFREE",
      5: "GLUTENFREE"
    };
    const dietTypeLabel = product.eDietType != null ? (dietTypeMap[product.eDietType] || "") : "";

    return res.status(200).json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        description: product.Description,
        information: product.Information,
        rating: product.Rating,
        price: product.Price,
        discountAmount: product.DiscountPrice,
        images: product.ProductImages?.map(img => img.Path) || [],
        weight: product.Weight || product.ProductWeights?.[0]?.Weight?.weight || "",
        weights: product.ProductWeights?.map(w => w.Weight) || [],
        tags: product.ProductTags?.map(t => t.Tag) || [],
        isOnlinePaymentOnly: product.isOnlinePaymentOnly ?? false,
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};