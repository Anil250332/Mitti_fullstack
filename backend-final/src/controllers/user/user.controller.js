const bcrypt = require("bcryptjs");
const { extractToken } = require("../../config/jwt");
const { CustomerAddress, User } = require("../../models");
const { Op } = require("sequelize");

/**
 * GET LOGGED-IN USER DETAILS
 */
exports.getMe = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true) return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id) return res.status(401).json({ success: false, message: "Invalid User Token." });

    const user = await User.findByPk(Token.id, {
      attributes: ["id", "name", "email", "mobile", "gstNo", "companyName"],
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * UPDATE GST DETAILS
 */
exports.updateGstDetails = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;
    const { companyName, gstNo } = req.body;

    if (!companyName || !gstNo) {
      return res.status(400).json({ success: false, message: "Company Name and GST No are required." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.companyName = companyName;
    user.gstNo = gstNo;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "GST details updated successfully",
      data: {
        companyName: user.companyName,
        gstNo: user.gstNo
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Add new address
 */
exports.saveAddress = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    const { id, title, address, city, state, country, pincode } = req.body;

    if (isNaN(id) || id < 0)
      return res.status(400).json({ success: false, message: "id is Invalid." });

    let Address;
    if (id > 0) {
      // SECURE: Only find address if it belongs to the current user
      Address = await CustomerAddress.findOne({ where: { id, userId } });

      if (!Address)
        return res.status(403).json({ success: false, message: "Address not found or unauthorized access." });

      await Address.update({
        title: title,
        address: address,
        city: city,
        state: state,
        country: country,
        pincode: pincode
      });

      return res.status(200).json({ success: true, message: "Address updated successfully", data: { id: Address.id } });
    }
    else {
      Address = await CustomerAddress.create({
        userId,
        title: title,
        address: address,
        city: city,
        state: state,
        country: country,
        pincode: pincode
      });

      return res.status(201).json({ success: true, message: "Address added successfully", data: { id: Address.id } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * Get all addresses of logged-in user
 */
exports.getAllAddresses = async (req, res) => {
  try {

    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    const data = await CustomerAddress.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]]
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * Get address by ID (own address only)
 */
exports.getAddressById = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;
    const { id } = req.params;

    const address = await CustomerAddress.findOne({ where: { id, userId } });

    if (!address)
      return res.status(404).json({ success: false, message: "Address not found" });

    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
};

/**
 * CHANGE PASSWORD
 */
exports.changePassword = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    const { email, oldPassword, newPassword } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email is required." });

    if (!oldPassword)
      return res.status(400).json({ success: false, message: "Old Password is required." });

    if (!newPassword)
      return res.status(400).json({ success: false, message: "New Password is required." });

    const emailNormalized = String(email).trim();
    const oldPasswordNormalized = String(oldPassword).trim();
    const newPasswordNormalized = String(newPassword).trim();

    if (oldPasswordNormalized === newPasswordNormalized)
      return res.status(400).json({ success: false, message: "New Password can not be same as Old Password." });

    const objUser = await User.findByPk(userId);
    if (!objUser)
      return res.status(400).json({ success: false, message: "User not found." });

    if (String(objUser.email ?? "").trim() !== emailNormalized)
      return res.status(400).json({ success: false, message: "Invalid Email Address." });

    const ok = await bcrypt.compare(oldPasswordNormalized, objUser.password);
    if (!ok)
      return res.status(400).json({ success: false, message: "Invalid Old Password." });

    objUser.password = await bcrypt.hash(newPasswordNormalized, 10);
    await objUser.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  }
  catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error !!" });
  }
}

/**
 * USER DETAILS UPDATE
 */
exports.updateUserDetails = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;

    const { name, email, mobile } = req.body;

    if (!name || !email || !mobile)
      return res.status(400).json({ success: false, message: "All fields are required." });

    const mobileStr = String(mobile).trim();
    if (mobileStr.length < 10)
      return res.status(400).json({ success: false, message: "mobile number is invalid." });

    const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: userId } } });
    if (existingUser)
      return res.status(409).json({ success: false, message: "User already exists with this email" });

    const objUser = await User.findByPk(userId);
    if (!objUser)
      return res.status(400).json({ success: false, message: "User not found." });

    objUser.name = name;
    objUser.email = email;
    objUser.mobile = mobileStr;

    await objUser.save();

    return res.status(200).json({ success: true, message: "User details updated successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * DELETE ADDRESS
 */
exports.deleteAddress = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const userId = Token.id;
    const { id } = req.params;

    const Address = await CustomerAddress.findOne({ where: { id, userId } });

    if (!Address)
      return res.status(404).json({ success: false, message: "Address not found or unauthorized access." });

    await Address.destroy();

    return res.status(200).json({ success: true, message: "Address deleted successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
