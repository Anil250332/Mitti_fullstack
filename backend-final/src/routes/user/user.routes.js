const express = require("express");
const router = express.Router();

const {
  saveAddress,
  getAllAddresses,
  getAddressById,
  changePassword,
  getMe,
  updateUserDetails,
  updateGstDetails,
  deleteAddress
} = require("../../controllers/user/user.controller");

router.post("/change_password", changePassword);
router.get("/me", getMe);
router.post("/save", updateUserDetails);
router.post("/gst-details", updateGstDetails);
router.post("/address/save", saveAddress);
router.get("/address/", getAllAddresses);
router.get("/address/:id", getAddressById);
router.delete("/address/:id", deleteAddress);

module.exports = router;
