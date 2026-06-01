const bcrypt = require("bcryptjs");
const { User, UserOtp } = require("../models");
const { generateToken } = require("../config/jwt");
const { where, Op } = require("sequelize");
const emailService = require("../services/email.service");

/**
 * USER LOGIN
 */
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ success: false, message: "User not Registered" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = generateToken({ id: user.id, role: "User" });
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      companyName: user.companyName,
      gstNo: user.gstNo,
    };

    return res.status(200).json({ success: true, message: "User login successful", token, user: userData });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * USER REGISTRATION
 */
exports.userRegister = async (req, res) => {
  try {
    const { name, email, password, mobile, otp } = req.body;

    if (!name || !email || !password || !mobile || !otp)
      return res.status(400).json({ success: false, message: "All fields including OTP are required" });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    // 1. Verify OTP - EMAIL BASED
    const checkEmail = String(email || "").trim();
    const checkOtp = String(otp || "").trim();

    const otpRecord = await UserOtp.findOne({
      where: {
        userId: null,
        phoneNo: checkEmail, // Email is stored in phoneNo column
        otp: checkOtp,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
     return res.status(400).json({
        success: false,
        message: "Incorrect OTP for this email address. Please check carefully."
      });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
     return res.status(400).json({ success: false, message: "This OTP has expired. Please resend." });
    }

  
    // 2. Check if user already exists (email or mobile)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { mobile }]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "mobile number";
      return res.status(409).json({ success: false, message: `User already exists with this ${field}` });
    }

    // 3. Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // 4. Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, mobile, });

    // 5. Generate token
    const token = generateToken({ id: user.id, role: "User" });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * SEND OTP (EMAIL) - Forgot Password
 */
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  // Map email from request to email column in DB
  const user = await User.findOne({ where: { email } });
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await UserOtp.create({
    userId: user.id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    isUsed: false,
    phoneNo: user.email // Store email in phoneNo column for simplicity or add email column
  });

  // Send Email via EmailJS
  await emailService.sendOTPEmail(user.email, otp, user.name);

  return res.status(200).json({ success: true, message: "OTP sent successfully to your email." });
};

/**
 * VERIFY OTP & CHANGE PASSWORD
 */
exports.verifyOtpAndChangePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;


  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Debugging: Check if any OTP exists for this user, ignoring isUsed/expiry first
  const debugOtp = await UserOtp.findOne({ where: { userId: user.id, otp } });
  if (debugOtp) {
  } else {
  }

  const otpRecord = await UserOtp.findOne({
    where: {
      userId: user.id,
      otp,
      isUsed: false
    }
  });

  if (!otpRecord) {
    return res.status(400).json({ success: false, message: "Invalid or used OTP" });
  }

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "OTP has expired" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  otpRecord.isUsed = true;
  await otpRecord.save();

  return res.status(200).json({ success: true, message: "Password changed successfully" });
};

/**
 * MOBILE REGISTER - SEND OTP
 * For new user registration with name, companyName, and mobile
 */
exports.mobileRegisterSendOtp = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required for registration" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists with this email. Please login instead." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store registration data temporarily in OTP record
    await UserOtp.create({
      userId: null, 
      phoneNo: email, // Using phoneNo column to store email for verification
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
      isUsed: false
    });

    // Send Email via EmailJS
    await emailService.sendOTPEmail(email, otp, name);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * MOBILE REGISTER - VERIFY OTP
 * Creates new user after OTP verification
 */
exports.mobileRegisterVerifyOtp = async (req, res) => {
  try {
    const { name, companyName, email, otp, mobile } = req.body;

    if (!email || !otp || !name) {
      return res.status(400).json({ success: false, message: "Name, email and OTP are required" });
    }

    // Check if user already exists (race condition protection)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists with this email address" });
    }

    // Find OTP record (userId is null for registration) - EMAIL BASED
    const checkEmail = String(email || "").trim();
    const checkOtp = String(otp || "").trim();

  
    const otpRecord = await UserOtp.findOne({
      where: {
        userId: null,
        phoneNo: checkEmail,
        otp: checkOtp,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
     return res.status(400).json({ success: false, message: "Invalid OTP for this email." });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

  
    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Create new user
    const user = await User.create({
      name,
      companyName: companyName || null,
      email,
      mobile: mobile || null
    });

    // Generate JWT token
    const token = generateToken({ id: user.id, role: "User" });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        companyName: user.companyName,
        mobile: user.mobile,
        email: user.email
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * EMAIL LOGIN - SEND OTP
 * For existing users to login with email only
 */
exports.mobileLoginSendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await UserOtp.create({
      userId: user.id,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      isUsed: false,
      phoneNo: email
    });

    // Send Email via EmailJS
    await emailService.sendOTPEmail(email, otp, user.name);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * EMAIL LOGIN - VERIFY OTP
 * Verifies OTP and logs in existing user via email
 */
exports.mobileLoginVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpRecord = await UserOtp.findOne({
      where: {
        userId: user.id,
        otp,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or used OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Generate JWT token
    const token = generateToken({ id: user.id, role: "User" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        companyName: user.companyName,
        mobile: user.mobile,
        email: user.email
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * VERIFY REGISTRATION OTP ONLY (For Frontend UI Check)
 */
exports.verifyRegistrationOtpOnly = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = String(email || "").trim();
    const cleanOtp = String(otp || "").trim();


    const otpRecord = await UserOtp.findOne({
      where: {
        userId: null,
        phoneNo: cleanEmail,
        otp: cleanOtp,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please check the code sent to your phone." });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully!" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
