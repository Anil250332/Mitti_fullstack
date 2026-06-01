const { Category } = require("../../models");

/**
 * GET ALL CATEGORIES (WITH PAGINATION)
 * ?page=1&limit=10
 */
exports.getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Category.findAndCountAll({ limit, offset, order: [["id", "DESC"]] });

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
 * GET CATEGORY BY ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, data: category });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SAVE CATEGORY (INSERT / UPDATE)
 */
exports.saveCategory = async (req, res) => {
  try {
    const { id, category } = req.body;

    if (!category)
      return res.status(400).json({ success: false, message: "Category name is required" });

    // UPDATE
    if (id) {
      const existingCategory = await Category.findByPk(id);

      if (!existingCategory)
        return res.status(404).json({ success: false, message: "Category not found" });

      existingCategory.category = category;
      await existingCategory.save();

      return res.status(200).json({ success: true, message: "Category updated successfully", data: existingCategory });
    }

    // INSERT
    const newCategory = await Category.create({ category });

    return res.status(201).json({ success: true, message: "Category created successfully", data: newCategory });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE CATEGORY
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    await category.destroy();

    return res.status(200).json({ success: true, message: "Category deleted successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
