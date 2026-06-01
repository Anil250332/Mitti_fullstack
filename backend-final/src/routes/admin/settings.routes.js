const express = require("express");
const router = express.Router();

const uploadSettingsLogo = require("../../config/multer.settingsLogo");

const {
  saveGeneralSettings,
  getGeneralSettings
} = require("../../controllers/admin/settings.controller");

const checkPermission = require("../../middlewares/permission");

// later you can add admin auth middleware
// Supports:
// - JSON body (no file)
// - multipart/form-data (optional file field: logo)
router.post("/", checkPermission("settings"), uploadSettingsLogo.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 }
]), saveGeneralSettings);
router.get("/", getGeneralSettings);

module.exports = router;
