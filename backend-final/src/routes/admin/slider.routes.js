const express = require("express");
const router = express.Router();

const upload = require("../../config/multer");

const {
    getAllSliders,
    saveSlider,
    deleteSlider
} = require("../../controllers/admin/slider.controller");

const checkPermission = require("../../middlewares/permission");

// ADMIN SLIDER ROUTES
router.get("/", checkPermission("sliders"), getAllSliders);
router.post("/save", checkPermission("sliders"), upload.single("file"), saveSlider);
router.delete("/:id", checkPermission("sliders"), deleteSlider);

module.exports = router;
