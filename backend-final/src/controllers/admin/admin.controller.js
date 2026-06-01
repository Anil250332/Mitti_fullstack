const bcrypt = require("bcryptjs");
const { Admin, User, Order, Permission } = require("../../models");
const { generateToken, extractToken } = require("../../config/jwt");
const { Users, Permissions } = require("../../config/permission");
const { Op, fn, col } = require("sequelize");

/**
 * GET ALL USERS (WITH PAGINATION)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Users))
      return res.status(403).json({ success: false, message: "you don't have permission to see users List." });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Admin.findAndCountAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["pageKey", "canView"]
        }
      ],
      limit,
      offset,
      order: [["id", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL CUSTOMERS (FOR DASHBOARD USERS PAGE)
 * Returns app users (customers) with orders count.
 * GET /api/admin/users/customers?page=&limit=&search=
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Users))
      return res.status(403).json({ success: false, message: "you don't have permission to see users List." });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ["id", "name", "email", "mobile"],
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    const ids = rows.map((u) => u.id).filter(Boolean);
    let ordersByCustomerId = {};
    if (ids.length) {
      const agg = await Order.findAll({
        attributes: ["CustomerId", [fn("COUNT", col("Order.id")), "orders"]],
        where: { CustomerId: { [Op.in]: ids } },
        group: ["CustomerId"],
      });
      ordersByCustomerId = agg.reduce((acc, r) => {
        const customerId = r.CustomerId;
        acc[customerId] = parseInt(r.get("orders")) || 0;
        return acc;
      }, {});
    }

    const data = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.mobile,
      orders: ordersByCustomerId[u.id] ?? 0,
      role: (ordersByCustomerId[u.id] ?? 0) > 0 ? "Customer" : "User",
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ADMIN USER BY ID
 */
exports.getUserById = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Users))
      return res.status(403).json({ success: false, message: "you don't have permission to see user Details." });

    const { id } = req.params;

    const admin = await Admin.findByPk(id, { attributes: { exclude: ["password"] } });

    if (!admin)
      return res.status(404).json({ success: false, message: "user not found" });

    return res.status(200).json({ success: true, message: "Users Get Successfully.", data: admin });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SAVE ADMIN USER (INSERT / UPDATE)
 */
exports.saveUser = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Users))
      return res.status(403).json({ success: false, message: "you don't have permission to save user." });

    const { id, firstName, lastName, email, phoneNo, username, password, isAdmin } = req.body;

    if (!firstName || !lastName || !email || !username)
      return res.status(400).json({ success: false, message: "Required fields are missing" });

    // UPDATE
    if (id) {
      const admin = await Admin.findByPk(id);

      if (!admin)
        return res.status(404).json({ success: false, message: "user not found" });

      admin.firstName = firstName;
      admin.lastName = lastName;
      admin.email = email;
      admin.phoneNo = phoneNo;
      admin.username = username;
      admin.isAdmin = isAdmin ?? admin.isAdmin;

      if (password) {
        admin.password = await bcrypt.hash(password, 10);
      }

      await admin.save();

      return res.status(200).json({ success: true, message: "user updated successfully" });
    }

    // INSERT
    if (!password)
      return res.status(400).json({ success: false, message: "Password is required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({ firstName, lastName, email, phoneNo, username, password: hashedPassword, isAdmin: isAdmin ?? false, isActive: true });

    return res.status(201).json({ success: true, message: "user created successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ACTIVE / INACTIVE ADMIN USER
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Users))
      return res.status(403).json({ success: false, message: "you don't have permission to change user status." });

    const { id } = req.params;

    const admin = await Admin.findByPk(id);

    if (!admin)
      return res.status(404).json({ success: false, message: "user not found" });

    admin.isActive = !admin.isActive;
    await admin.save();

    return res.status(200).json({ success: true, message: `user ${admin.isActive ? "activated" : "deactivated"} successfully` });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET PERMISSIONS BY USER ID
 */
exports.getPermissions = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Permissions))
      return res.status(403).json({ success: false, message: "you don't have permission to see user permissions." });

    const permissions = await Admin.findAll({
      where: { isActive: true },
      attributes: ["id", "firstName", "lastName"],
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["pageKey", "canView"]
        }
      ]
    })

    return res.status(200).json({ success: true, message: "Permission Get Successfully.", data: permissions });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * SAVE PERMISSIONS (REPLACE ALL)
 * permissions: [{ pageKey, canView }]
 */
exports.savePermissions = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(400).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Permissions))
      return res.status(403).json({ success: false, message: "you don't have permission to save user permissions." });

    const { UserId, permissions } = req.body;

    if (!UserId || !Array.isArray(permissions))
      return res.status(400).json({ success: false, message: "Invalid payload" });

    // Remove old permissions
    await Permission.destroy({ where: { adminUserId: UserId } });

    // Insert new permissions
    const data = permissions.map(p => ({ adminUserId: UserId, pageKey: p.pageKey, canView: p.canView }));

    await Permission.bulkCreate(data);

    return res.status(200).json({ success: true, message: "Permissions saved successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN LOGIN
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const admin = await Admin.findOne({ where: { email } });
    if (!admin)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // Fetch permissions
    const permissions = await Permission.findAll({
      where: {
        adminUserId: admin.id,
        canView: true
      },
      attributes: ["pageKey"]
    });

    const permissionKeys = permissions.map(p => p.pageKey);

    const token = generateToken({ id: admin.id, role: "AdminUser", isAdmin: admin.isAdmin, permissions: permissionKeys });

    const userData = {
      id: admin.id,
      name: `${admin.firstName} ${admin.lastName}`,
      email: admin.email,
      phoneNo: admin.phoneNo,
      username: admin.username,
      isAdmin: admin.isAdmin,
    };

    return res.status(200).json({ success: true, message: "Admin login successful", token, permissions: permissionKeys, user: userData });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * DELETE ADMIN USER
 */
exports.deleteUser = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!(Token.permissions || []).includes(Users))
      return res.status(403).json({ success: false, message: "you don't have permission to delete user." });

    const { id } = req.params;

    // Don't allow self-deletion via this route for safety, or check if it's the last admin
    if (Token.id == id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    const admin = await Admin.findByPk(id);
    if (!admin)
      return res.status(404).json({ success: false, message: "User not found" });

    // Delete associated permissions first
    await Permission.destroy({ where: { adminUserId: id } });

    // Delete the admin
    await admin.destroy();

    return res.status(200).json({ success: true, message: "User deleted successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * GET CURRENT AUTHENTICATED ADMIN
 */
exports.getAdminMe = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    const admin = await Admin.findByPk(Token.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["pageKey", "canView"],
          where: { canView: true },
          required: false
        }
      ]
    });

    if (!admin)
      return res.status(404).json({ success: false, message: "Admin not found" });

    return res.status(200).json({ success: true, data: admin });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
