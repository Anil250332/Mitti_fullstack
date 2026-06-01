const express = require("express");
const router = express.Router();

const {
  getAllWeights,
  getWeightById,
  saveWeight,
  deleteWeight
} = require("../../controllers/admin/weight.controller");

// ADMIN WEIGHT ROUTES
router.get("/", getAllWeights);
router.get("/:id", getWeightById);
router.post("/save", saveWeight);
router.delete("/:id", deleteWeight);

module.exports = router;
