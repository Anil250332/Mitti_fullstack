const { Slider } = require("../../models");

/**
 * GET ALL SLIDERS (ADMIN)
 * ?page=1&limit=10
 */
exports.getAllSliders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { rows, count } = await Slider.findAndCountAll({
            limit,
            offset,
            order: [["order", "ASC"], ["id", "DESC"]]
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
 * GET ACTIVE SLIDERS (USER)
 */
exports.getActiveSliders = async (req, res) => {
    try {
        const sliders = await Slider.findAll({
            where: { isActive: true },
            order: [["order", "ASC"], ["id", "DESC"]]
        });

        return res.status(200).json({ success: true, data: sliders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * SAVE SLIDER (INSERT / UPDATE)
 * Handles both based on id presence (id: 0 or null for insert)
 */
exports.saveSlider = async (req, res) => {
    try {
      const { id, type, order, isActive } = req.body;
        let url = req.body.url;

        // If file is uploaded, use the relative URL path
        if (req.file) {
            url = `/uploads/${req.file.filename}`;
        }

        // For INSERT (Add mode), url is mandatory
        if (!id || id === "0" || id === 0) {
            if (!url) {
                return res.status(400).json({ success: false, message: "URL/Path or File is required for new sliders" });
            }
        }

        const payload = {
            type: type || "image",
            url,
            order: order !== undefined ? parseInt(order) : 0,
            isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true
        };


        // UPDATE
        if (id && id !== "0" && id !== 0) {
            const existingSlider = await Slider.findByPk(id);

            if (!existingSlider) {
                return res.status(404).json({ success: false, message: "Slider not found" });
            }

            await existingSlider.update(payload);

            return res.status(200).json({
                success: true,
                message: "Slider updated successfully",
                data: existingSlider
            });
        }

        // INSERT
        const newSlider = await Slider.create(payload);

        return res.status(201).json({
            success: true,
            message: "Slider created successfully",
            data: newSlider
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE SLIDER
 */
exports.deleteSlider = async (req, res) => {
    try {
        const { id } = req.params;

        const slider = await Slider.findByPk(id);

        if (!slider) {
            return res.status(404).json({ success: false, message: "Slider not found" });
        }

        await slider.destroy();

        return res.status(200).json({ success: true, message: "Slider deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
