const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  getCategoryById,
  saveCategory,
  deleteCategory
} = require("../../controllers/admin/category.controller");

const checkPermission = require("../../middlewares/permission");

// ADMIN CATEGORY ROUTES
router.get("/", checkPermission("categories"), getAllCategories);
router.get("/:id", checkPermission("categories"), getCategoryById);
router.post("/save", checkPermission("categories"), saveCategory);
router.delete("/:id", checkPermission("categories"), deleteCategory);

module.exports = router;
