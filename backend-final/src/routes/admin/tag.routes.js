const express = require("express");
const router = express.Router();

const {
  getAllTags,
  getTagById,
  saveTag,
  deleteTag
} = require("../../controllers/admin/tag.controller");

const checkPermission = require("../../middlewares/permission");

// ADMIN TAG ROUTES
router.get("/", checkPermission("tags"), getAllTags);
router.get("/:id", checkPermission("tags"), getTagById);
router.post("/save", checkPermission("tags"), saveTag);
router.delete("/:id", checkPermission("tags"), deleteTag);

module.exports = router;
