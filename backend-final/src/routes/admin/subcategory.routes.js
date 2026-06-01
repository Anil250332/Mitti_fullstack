const express = require("express");
const router = express.Router();

const {
  getAllSubCategories,
  getSubCategoryById,
  saveSubCategory,
  deleteSubCategory
} = require("../../controllers/admin/subcategory.controller");

const checkPermission = require("../../middlewares/permission");

// ADMIN SUBCATEGORY ROUTES
router.get("/", checkPermission("categories"), getAllSubCategories);
router.get("/:id", checkPermission("categories"), getSubCategoryById);
router.post("/save", checkPermission("categories"), saveSubCategory);
router.delete("/:id", checkPermission("categories"), deleteSubCategory);

module.exports = router;
