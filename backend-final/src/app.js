const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const helmet = require("helmet");

const app = express();

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const authRoutes = require("./routes/auth.routes");
const weightRoutes = require("./routes/admin/weight.routes");
const tagRoutes = require("./routes/admin/tag.routes");
const categoryRoutes = require("./routes/admin/category.routes");
const productRoutes = require("./routes/admin/product.routes");
const subcategoryRoutes = require("./routes/admin/subcategory.routes");
const adminRoutes = require("./routes/admin/admin.routes");
const orderRoutes = require("./routes/admin/order.routes");
const settingsRoutes = require("./routes/admin/settings.routes");
const dashboardRoutes = require("./routes/admin/dashboard.routes");
const adminCouponRoutes = require("./routes/admin/coupon.routes");
const adminSliderRoutes = require("./routes/admin/slider.routes");
const adminReviewRoutes = require("./routes/admin/review.routes");
const contactRoutes = require("./routes/contact.routes");

const userRoutes = require("./routes/user/user.routes");
const wishlistRoutes = require("./routes/user/wishlist.routes");
const cartRoutes = require("./routes/user/cart.routes");
const productsRoutes = require("./routes/user/product.routes");
const userCouponRoutes = require("./routes/user/coupon.routes");
const sliderRoutes = require("./routes/user/slider.routes");

const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
const allowedOrigins = [
    "http://shriradhecollection.com",
    "https://shriradhecollection.com",
    "http://localhost:5173",
    "http://localhost:3000",
    ...envOrigins
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const originClean = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.some(allowed => allowed.replace(/\/$/, "") === originClean);

        if (!isAllowed) {
            return callback(new Error('Not allowed by CORS'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Comprehensive Static File Serving for CPanel
const PROJECT_ROOT = path.join(__dirname, "..");
const uploadsPath = path.join(PROJECT_ROOT, "uploads");
const productsPath = path.join(uploadsPath, "products");

// Ensure directories exist
[uploadsPath, productsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Serve on both routes for maximum compatibility
app.use("/api/uploads/products", express.static(productsPath));
app.use("/api/uploads/settings", express.static(path.join(uploadsPath, "settings")));
app.use("/api/uploads", express.static(uploadsPath));
app.use("/uploads", express.static(uploadsPath));

// Debug Route to check paths on server
app.get("/api/debug-images", (req, res) => {
    const files = fs.existsSync(productsPath) ? fs.readdirSync(productsPath) : "products folder not found";
    res.json({
        PROJECT_ROOT,
        uploadsPath,
        productsPath,
        filesInProducts: files,
        cwd: process.cwd(),
        dirname: __dirname
    });
});

// Health Check / Status Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Mitti Backend API!",
        status: "Running"
    });
});

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend API Success",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/weights", weightRoutes);
app.use("/api/admin/tags", tagRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/subcategories", subcategoryRoutes);
app.use("/api/admin/orders", orderRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/sliders", adminSliderRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/contact", contactRoutes);



// app.use("/api/products", customerProductRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/coupons", userCouponRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/user", userRoutes);



// Global Error Handler
app.use((err, req, res, next) => {
    // Log error to file
    const logData = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
    fs.appendFile('error_log.txt', logData, (fsErr) => {
        // Could not write to error log file
    });


    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

module.exports = app;