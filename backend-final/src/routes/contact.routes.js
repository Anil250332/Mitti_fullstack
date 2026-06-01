const express = require("express");
const router = express.Router();
const controller = require("../controllers/contact.controller");

const checkPermission = require("../middlewares/permission");

// Public route to submit form
router.post("/", controller.createContact);

// Admin routes
router.get("/", checkPermission("messages"), controller.getAllContacts);
router.delete("/:id", checkPermission("messages"), controller.deleteContact);

module.exports = router;
