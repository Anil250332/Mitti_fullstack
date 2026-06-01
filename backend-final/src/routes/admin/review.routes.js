const router = require("express").Router();
const reviewController = require("../../controllers/admin/review.controller");
const upload = require("../../config/multer");
const checkPermission = require("../../middlewares/permission");

router.post("/add", checkPermission("products"), upload.single("customerImage"), reviewController.addReview);
router.get("/", checkPermission("products"), reviewController.getAllReviewsAdmin);
router.delete("/delete/:id", checkPermission("products"), reviewController.deleteReview);

module.exports = router;
