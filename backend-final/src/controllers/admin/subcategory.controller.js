const { SubCategory, Category } = require("../../models");

/**
 * GET ALL SUB CATEGORIES (WITH PAGINATION + OPTIONAL CATEGORY FILTER)
 * ?page=1&limit=10&categoryId=2
 */
exports.getAllSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (categoryId) whereCondition.CategoryId = categoryId;

    const { rows, count } = await SubCategory.findAndCountAll({
      where: whereCondition,
      include: [{ model: Category, attributes: ["id", "category"] }],
      limit,
      offset,
      order: [["id", "DESC"]]
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
 * GET SUB CATEGORY BY ID
 */
exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const sub = await SubCategory.findByPk(id, {
      include: [{ model: Category, attributes: ["id", "category"] }]
    });

    if (!sub)
      return res.status(404).json({ success: false, message: "Sub category not found" });

    return res.status(200).json({ success: true, data: sub });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SAVE SUB CATEGORY (INSERT / UPDATE)
 */
exports.saveSubCategory = async (req, res) => {
  try {
    const { id, name, categoryId } = req.body;

    if (!name)
      return res.status(400).json({ success: false, message: "Sub category name is required" });

    if (!categoryId)
      return res.status(400).json({ success: false, message: "Parent category is required" });

    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists)
      return res.status(400).json({ success: false, message: "Invalid parent category" });

    // UPDATE
    if (id) {
      const existing = await SubCategory.findByPk(id);
      if (!existing)
        return res.status(404).json({ success: false, message: "Sub category not found" });

      existing.name = name;
      existing.CategoryId = categoryId;
      await existing.save();

      return res.status(200).json({ success: true, message: "Sub category updated successfully", data: existing });
    }

    // INSERT
    const newSub = await SubCategory.create({ name, CategoryId: categoryId });

    return res.status(201).json({ success: true, message: "Sub category created successfully", data: newSub });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE SUB CATEGORY
 */
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const sub = await SubCategory.findByPk(id);
    if (!sub)
      return res.status(404).json({ success: false, message: "Sub category not found" });

    await sub.destroy();

    return res.status(200).json({ success: true, message: "Sub category deleted successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
