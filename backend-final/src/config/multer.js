const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsDir);
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname || "").toLowerCase();
		const safeExt = ext && ext.length <= 10 ? ext : "";
		const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
		cb(null, uniqueName);
	}
});

const fileFilter = (req, file, cb) => {
	if (file && typeof file.mimetype === "string" &&
		(file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/"))) {
		return cb(null, true);
	}

	return cb(new Error("Only image and video files are allowed"));
};

module.exports = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 500 * 1024 * 1024 // 500MB for high-quality videos
	}
});
