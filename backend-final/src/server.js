require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await sequelize.authenticate();

        await sequelize.sync();

        // Schema updates
        const addColumnSafe = async (table, column, definition) => {
            try {
                await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
            } catch (err) {
                if (err.parent && (err.parent.errno === 1060 || err.parent.code === 'ER_DUP_FIELDNAME')) {
                } else {
                    // Could not add column
                }
            }
        };

        // Ensure nimbus_logs table exists and uses TEXT instead of JSON (for compatibility)
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS nimbus_logs (
                id INT NOT NULL AUTO_INCREMENT,
                type ENUM('login', 'check_serviceability', 'create_shipment', 'tracking') NOT NULL,
                endpoint VARCHAR(255) DEFAULT NULL,
                requestPayload TEXT DEFAULT NULL,
                responseData TEXT DEFAULT NULL,
                errorMessage TEXT DEFAULT NULL,
                success TINYINT(1) DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Fix existing columns if they were created as JSON (to avoid silent failures)
        try {
            await sequelize.query("ALTER TABLE nimbus_logs MODIFY COLUMN requestPayload TEXT;");
            await sequelize.query("ALTER TABLE nimbus_logs MODIFY COLUMN responseData TEXT;");
        } catch (modifyErr) {
            // Probably already TEXT or doesn't support JSON
        }

        await addColumnSafe("Users", "companyName", "VARCHAR(255) NULL");
        await addColumnSafe("Users", "gstNo", "VARCHAR(255) NULL");
        await addColumnSafe("products", "isOnlinePaymentOnly", "TINYINT(1) DEFAULT 0");
        await addColumnSafe("products", "SubCategoryId", "INT NULL");
        await addColumnSafe("Orders", "PaymentMethod", "VARCHAR(255) DEFAULT 'COD'");
        await addColumnSafe("Orders", "TaxAmount", "DECIMAL(10,2) DEFAULT 0");
        await addColumnSafe("Orders", "DeliveryCharges", "DECIMAL(10,2) DEFAULT 0");
        await addColumnSafe("products", "SubTitle", "VARCHAR(255) NULL");
        await addColumnSafe("products", "PiecesPerJar", "VARCHAR(255) NULL");
        await addColumnSafe("products", "MRPPerJar", "VARCHAR(255) NULL");
        await addColumnSafe("products", "MRPPerPiece", "VARCHAR(255) NULL");
        await addColumnSafe("products", "PacketsPerJar", "INT NULL");
        await addColumnSafe("products", "PiecesPerJarLabel", "VARCHAR(255) NULL");
        await addColumnSafe("products", "MRPPerJarLabel", "VARCHAR(255) NULL");
        await addColumnSafe("products", "MRPPerPieceLabel", "VARCHAR(255) NULL");
        await addColumnSafe("products", "PacketsPerJarLabel", "VARCHAR(255) NULL");
        await addColumnSafe("products", "Position", "INT DEFAULT 0");
        await addColumnSafe("Orders", "ShiprocketOrderId", "VARCHAR(255) NULL");
        await addColumnSafe("Orders", "ShipmentId", "VARCHAR(255) NULL");
        await addColumnSafe("Orders", "paymentSlip", "TEXT NULL");
        await addColumnSafe("coupons", "isCodAllowed", "TINYINT(1) DEFAULT 1");
        await addColumnSafe("coupons", "isOnlineAllowed", "TINYINT(1) DEFAULT 1");

        // Settings table updates
        await addColumnSafe("Settings", "openingTime", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "closingTime", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "TimeDetail1", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "facebook", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "instagram", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "youtube", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "linkedin", "VARCHAR(255) NULL");
        await addColumnSafe("Settings", "qrCode", "VARCHAR(255) NULL");

        try {
            await sequelize.query("ALTER TABLE sliders MODIFY COLUMN type ENUM('image', 'video') NOT NULL DEFAULT 'image';");

        } catch (sliderErr) {
            // Sliders schema update note
        }

        app.listen(PORT, () => {
        });

    } catch (error) {
        process.exit(1);
    }
}

startServer();

// Keep process alive
setInterval(() => {
}, 60000);

process.on('unhandledRejection', (reason, promise) => {
    // Unhandled Rejection
});

process.on('uncaughtException', (err) => {
    // Uncaught Exception
});

