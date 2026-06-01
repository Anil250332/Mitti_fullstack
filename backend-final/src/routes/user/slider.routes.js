const express = require("express");
const router = express.Router();

const {
    getActiveSliders
} = require("../../controllers/admin/slider.controller");

// USER SLIDER ROUTES
router.get("/", getActiveSliders);

module.exports = router;
