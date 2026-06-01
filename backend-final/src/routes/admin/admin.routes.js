const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getAllCustomers,
  getUserById,
  saveUser,
  toggleUserStatus,
  getPermissions,
  savePermissions,
  deleteUser,
  getAdminMe
} = require("../../controllers/admin/admin.controller");

const checkPermission = require("../../middlewares/permission");

// ADMIN USER ROUTES
router.get("/me", getAdminMe);
router.patch("/changeStatus/:id", checkPermission("users"), toggleUserStatus);
router.post("/permission/save", checkPermission("permissions"), savePermissions);
router.get("/permission", checkPermission("permissions"), getPermissions);
router.post("/save", checkPermission("users"), saveUser);
router.get("/customers", checkPermission("users"), getAllCustomers);
router.delete("/:id", checkPermission("users"), deleteUser);
router.get("/:id", checkPermission("users"), getUserById);
router.get("/", checkPermission("users"), getAllUsers);

module.exports = router;
