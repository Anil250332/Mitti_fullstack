const {
  Product,
  ProductImage,
  ProductWeight,
  ProductTag,
  Category,
  SubCategory,
  Weight,
  Tag
} = require("../../models");

const Sequelize = require("../../config/db");
const { Products } = require("../../config/permission");
const { extractToken } = require("../../config/jwt");
const { where, Op, col } = require("sequelize");

const parseJsonMaybe = (value) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const normalizeIdArray = (value) => {
  if (value == null) return [];

  // When multipart/form-data is used, arrays often arrive as strings.
  // Support JSON array ("[1,2]") or CSV ("1,2").
  let raw = value;
  if (typeof raw === "string") {
    const parsed = parseJsonMaybe(raw);
    raw = parsed != null ? parsed : raw;
  }

  const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  return [...new Set(
    arr
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isFinite(n))
  )];
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return true;
    if (["false", "0", "no", "off"].includes(v)) return false;
  }
  return null;
};





/**
 * GET ALL PRODUCTS (WITH PAGINATION)
 */
exports.getAllProducts = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Products))
      return res.status(403).json({ success: false, message: "Permission denied." });

    const { categoryId, subCategoryId, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    const whereCondition = {};

    if (subCategoryId)
      whereCondition.SubCategoryId = subCategoryId;
    else if (categoryId)
      whereCondition.CategoryId = categoryId;



    if (search) {
      whereCondition.name = { [Op.like]: `%${String(search).trim()}%` };
    }

    const { rows, count } = await Product.findAndCountAll({
      limit,
      offset,
      where: whereCondition,
      order: [["id", "ASC"]],
      include: [
        { model: Category },
        { model: SubCategory },
        { model: ProductImage },
        { model: ProductWeight, include: [Weight] },
        { model: ProductTag, include: [Tag] }
      ]
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET PRODUCT BY ID
 */
exports.getProductById = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to view product." });

    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category },
        { model: SubCategory },
        { model: ProductImage },
        { model: ProductTag, include: [Tag] }
      ]
    });

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    return res.status(200).json({ success: true, data: product });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SAVE PRODUCT (INSERT / UPDATE)
 */
exports.saveProduct = async (req, res) => {
  const t = await Product.sequelize.transaction();

  let message = "";

  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to save product." });

    const { id, name, description, information, rating, price, discountPrice, subcategoryId, qty, weight, minQty, tags = [], images = [], isOnlinePaymentOnly } = req.body;

    const uploadedFiles = Array.isArray(req.files) ? req.files : [];

    const normalizedTags = normalizeIdArray(tags);
    const imagesFromBodyParsed = typeof images === "string" ? (parseJsonMaybe(images) ?? []) : images;
    const imagesFromBody = Array.isArray(imagesFromBodyParsed) ? imagesFromBodyParsed : [];

    const normalizedPrice = Number(price);
    const normalizedDiscountPrice = discountPrice != null && String(discountPrice).trim() !== "" ? Number(discountPrice) : null;
    const normalizedSubCategoryId = Number(subcategoryId);
    const normalizedQty = Number(qty);
    const normalizedMinQty = Number(minQty);
    const normalizedWeight = weight;
    const normalizedRating = rating != null && String(rating).trim() !== "" ? Number(rating) : null;
    const normalizedIsOnlinePaymentOnly = normalizeBoolean(isOnlinePaymentOnly) ?? false;

    if (!name)
      return res.status(400).json({ success: false, message: "Product name is required" });

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0)
      return res.status(400).json({ success: false, message: "price is required" });

    if (!Number.isFinite(normalizedSubCategoryId) || normalizedSubCategoryId <= 0)
      return res.status(400).json({ success: false, message: "Sub Category is required" });

    // Validate subcategory and derive parent category
    const subCategoryExists = await SubCategory.findByPk(normalizedSubCategoryId);
    if (!subCategoryExists)
      return res.status(400).json({ success: false, message: "Invalid Sub Category: Sub Category not found" });
    const normalizedCategoryId = subCategoryExists.CategoryId;

    if (normalizedWeight == null || String(normalizedWeight).trim() === "")
      return res.status(400).json({ success: false, message: "Weight is required" });



    if (!Number.isFinite(normalizedQty) || normalizedQty < 0)
      return res.status(400).json({ success: false, message: "Stock Quantity is required" });

    if (!Number.isFinite(normalizedMinQty) || normalizedMinQty <= 0)
      return res.status(400).json({ success: false, message: "Minimum Quantity is required" });

    // Images are required for new product. For update we keep existing images unless new ones are provided.
    if (!id && uploadedFiles.length === 0 && imagesFromBody.length === 0)
      return res.status(400).json({ success: false, message: "images are required" });

    let product;

    // UPDATE
    if (id) {
      product = await Product.findByPk(id);

      if (!product)
        return res.status(404).json({ success: false, message: "Product not found" });

      await product.update(
        {
          name: name,
          Description: description,
          Information: information,
          Rating: normalizedRating,
          Price: normalizedPrice,
          DiscountPrice: Number.isFinite(normalizedDiscountPrice) ? normalizedDiscountPrice : null,
          CategoryId: normalizedCategoryId,
          SubCategoryId: normalizedSubCategoryId,
          Qty: normalizedQty,
          MinQty: normalizedMinQty,
          Weight: normalizedWeight,
          isOnlinePaymentOnly: normalizedIsOnlinePaymentOnly,
        },
        { transaction: t }
      );



      // Remove old mappings
      await ProductTag.destroy({ where: { ProductId: id }, transaction: t });

      message = "Product updated successfully";

    } else {
      // INSERT
      product = await Product.create(
        {
          name: name,
          Description: description,
          Information: information,
          Rating: normalizedRating,
          Price: normalizedPrice,
          DiscountPrice: Number.isFinite(normalizedDiscountPrice) ? normalizedDiscountPrice : null,
          CategoryId: normalizedCategoryId,
          SubCategoryId: normalizedSubCategoryId,
          Qty: normalizedQty,
          MinQty: normalizedMinQty,
          Weight: normalizedWeight,
          isOnlinePaymentOnly: normalizedIsOnlinePaymentOnly,
          IsActive: true
        },
        { transaction: t }
      );



      message = "Product created successfully";
    }

    // Tags
    if (normalizedTags.length) {
      const tagData = normalizedTags.map(tg => ({ ProductId: product.id, TagId: tg }));
      await ProductTag.bulkCreate(tagData, { transaction: t });
    }

    // Images (supports multipart uploads and legacy JSON metadata)
    const shouldReplaceImages = uploadedFiles.length > 0 || imagesFromBody.length > 0;
    if (id && shouldReplaceImages) {
      await ProductImage.destroy({ where: { ProductId: product.id }, transaction: t });
    }

    if (uploadedFiles.length) {
      const fs = require("fs");
      const path = require("path");

      const productUploadDir = path.join(__dirname, "..", "..", "..", "uploads", "products");
      if (!fs.existsSync(productUploadDir)) {
        fs.mkdirSync(productUploadDir, { recursive: true });
      }

      const imageData = [];
      for (const file of uploadedFiles) {
        const oldPath = file.path; // Multer's temp/final path (normally in /uploads root)
        const newFileName = file.filename;
        const newPath = path.join(productUploadDir, newFileName);

        // Move file if it's currently in the root uploads folder
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }

        imageData.push({
          ProductId: product.id,
          GUID: newFileName,
          Path: `/uploads/products/${newFileName}`,
          eExtension: null
        });
      }
      await ProductImage.bulkCreate(imageData, { transaction: t });
    } else if (imagesFromBody.length) {
      const imageData = imagesFromBody.map(img => ({
        ProductId: product.id,
        GUID: img.guid,
        Path: img.path,
        eExtension: img.eExtension
      }));
      await ProductImage.bulkCreate(imageData, { transaction: t });
    }

    await t.commit();

    return res.status(id ? 200 : 201).json({ success: true, message: message, productId: product.id });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE PRODUCT
 */
exports.deleteProduct = async (req, res) => {
  const t = await Product.sequelize.transaction();
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to delete product." });

    const { id } = req.params;

    const product = await Product.findByPk(id, { transaction: t });

    if (!product) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const { Review, ProductWishlist, CartItem } = require("../../models");

    await ProductImage.destroy({ where: { ProductId: id }, transaction: t });
    await ProductWeight.destroy({ where: { ProductId: id }, transaction: t });
    await ProductTag.destroy({ where: { ProductId: id }, transaction: t });
    await Review.destroy({ where: { productId: id }, transaction: t });
    await ProductWishlist.destroy({ where: { productId: id }, transaction: t });
    await CartItem.destroy({ where: { productId: id }, transaction: t });
    
    await product.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ success: true, message: "Product deleted successfully" });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE PRODUCT STATUS (ACTIVE / DEACTIVE)
 */
exports.changeStatusProduct = async (req, res) => {
  try {

    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to update product." });

    const { id, isActive } = req.body;
    const next = normalizeBoolean(isActive);
    if (!id || next == null)
      return res.status(400).json({ success: false, message: "Product id and status are required" });

    let product = await Product.findByPk(id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    await product.update({ IsActive: next });

    return res.status(200).json({ success: true, message: "Product Status Updated successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE PRODUCT STATUS (ACTIVE / DEACTIVE) BY PARAM ID
 * PATCH /api/admin/products/:id/status
 * body: { isActive: boolean | 0/1 | "true"/"false" }
 */
exports.updateProductActiveStatus = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to update product." });

    const { id } = req.params;
    const next = normalizeBoolean(req.body?.isActive);
    if (!id || next == null)
      return res.status(400).json({ success: false, message: "Product id and status are required" });

    const product = await Product.findByPk(id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    await product.update({ IsActive: next });

    return res.status(200).json({
      success: true,
      message: "Product Status Updated successfully",
      data: { id: product.id, isActive: product.IsActive },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SET PRODUCT BEST SELLER
 */
exports.setBestSellerProduct = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to update product." });

    const { id, isBestSeller } = req.body;
    const next = normalizeBoolean(isBestSeller);
    if (!id || next == null)
      return res.status(400).json({ success: false, message: "Product id and status are required" });

    let product = await Product.findByPk(id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    await product.update({ IsBestSeller: next });

    return res.status(200).json({ success: true, message: "Product Status Updated successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TOGGLE ONLINE PAYMENT ONLY
 */
exports.toggleOnlinePaymentOnly = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to update product." });

    const { id, isOnlinePaymentOnly } = req.body;
    const next = normalizeBoolean(isOnlinePaymentOnly);
    if (!id || next == null)
      return res.status(400).json({ success: false, message: "Product id and status are required" });

    let product = await Product.findByPk(id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    await product.update({ isOnlinePaymentOnly: next });

    return res.status(200).json({ success: true, message: `Online Payment Only ${next ? "Enabled" : "Disabled"} successfully` });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get products with low stock (qty < minQty)
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to update product." });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const products = await Product.findAll({
      limit,
      offset,
      where: {
        Qty: {
          [Op.lt]: col("MinQty")
        }
      },
      attributes: [
        "id",
        "name",
        "Qty",
        "IsActive"
      ],
      include: [
        {
          model: Category,
          attributes: ["category"]
        }
      ],
      order: [["Qty", "ASC"]]
    });

    const response = products.map(p => ({
      id: p.id,
      productName: p.name,
      categoryName: p.Category?.category || null,
      isActive: p.IsActive,
      qty: p.Qty
    }));

    return res.status(200).json({ success: true, count: response.length, data: response });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch low stock products" });
  }
};

/**
 * Increase or Decrease Product Qty
 */
exports.updateProductStock = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!Token.permissions.includes(Products))
      return res.status(400).json({ success: false, message: "you don't have permission to update product." });

    const { id } = req.params;
    const { qty, action } = req.body;

    if (!qty || qty <= 0)
      return res.status(400).json({ success: false, message: "Qty must be greater than 0" });

    if (!["increase", "decrease"].includes(action))
      return res.status(400).json({ success: false, message: "Action must be 'increase' or 'decrease'" });

    const product = await Product.findByPk(id);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    let newQty = Number(product.Qty) || 0;

    if (action === "increase") {
      newQty += qty;
    }
    else {
      if ((Number(product.Qty) || 0) < qty)
        return res.status(400).json({ success: false, message: "Insufficient stock" });

      newQty -= qty;
    }

    await product.update({ Qty: newQty });

    return res.status(200).json({
      success: true,
      message: `Product stock ${action}d successfully`
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update product stock" });
  }
};