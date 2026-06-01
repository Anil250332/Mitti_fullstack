const { Tag } = require("../../models");

/**
 * GET ALL TAGS (WITH PAGINATION)
 * ?page=1&limit=10
 */
exports.getAllTags = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Tag.findAndCountAll({ limit, offset, order: [["id", "DESC"]] });

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
 * GET TAG BY ID
 */
exports.getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findByPk(id);

    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });

    return res.status(200).json({ success: true, data: tag });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SAVE TAG (INSERT / UPDATE)
 */
exports.saveTag = async (req, res) => {
  try {
    const { id, tag } = req.body;

    if (!tag)
      return res.status(400).json({ success: false, message: "Tag is required" });

    // UPDATE
    if (id) {
      const existingTag = await Tag.findByPk(id);

      if (!existingTag)
        return res.status(404).json({ success: false, message: "Tag not found" });

      existingTag.tag = tag;
      await existingTag.save();

      return res.status(200).json({ success: true, message: "Tag updated successfully", data: existingTag });
    }

    // INSERT
    const newTag = await Tag.create({ tag });

    return res.status(201).json({ success: true, message: "Tag created successfully", data: newTag });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE TAG
 */
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findByPk(id);

    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });

    await tag.destroy();

    return res.status(200).json({ success: true, message: "Tag deleted successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
