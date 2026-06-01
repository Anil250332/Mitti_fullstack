const { extractToken } = require("../config/jwt");
const { Admin, Permission } = require("../models");

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const jwt = extractToken(req);
            if (jwt.success !== true) {
                return res.status(401).json(jwt);
            }

            const tokenData = jwt.Token;

            // 0. Ensure this is an admin token to prevent ID clashes with regular users
            if (tokenData.role !== "AdminUser") {
                return res.status(403).json({ success: false, message: "Unauthorized access: Admin restricted." });
            }

            // 1. Fetch user to verify they are still an admin and active
            const adminUser = await Admin.findByPk(tokenData.id);
            if (!adminUser || !adminUser.isActive) {
                return res.status(401).json({ success: false, message: "Account disabled or not found." });
            }

            // 2. Super Admin bypass (Check for true or numeric 1)
            if (adminUser.isAdmin === true || adminUser.isAdmin === 1) {
                return next();
            }

            // 3. Check permissions in DB (Real-time check)
            const permission = await Permission.findOne({
                where: {
                    adminUserId: adminUser.id,
                    pageKey: requiredPermission,
                    canView: true
                }
            });

            if (permission) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Permission denied: ${requiredPermission} access required.`
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Internal Server Error during permission check" });
        }
    };
};

module.exports = checkPermission;
