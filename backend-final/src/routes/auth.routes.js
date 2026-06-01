const express = require("express");
const router = express.Router();





const {
    
    userRegister,
    userLogin,
    sendOtp,
    verifyOtpAndChangePassword,
    mobileRegisterSendOtp,
    mobileRegisterVerifyOtp,
    mobileLoginSendOtp,
    mobileLoginVerifyOtp
} = require("../controllers/auth.controller");
const { adminLogin } = require("../controllers/admin/admin.controller");

// USER REGISTRATION
router.post("/user/register", userRegister);

// USER LOGIN
router.post("/user/login", userLogin);

// FORGOT PASSWORD - SEND OTP
router.post("/user/forgot-password", sendOtp);

// FORGOT PASSWORD - VERIFY OTP & RESET PASSWORD
router.post("/user/reset-password", verifyOtpAndChangePassword);

// MOBILE REGISTER (New user registration with OTP)
router.post("/user/mobile-register/send-otp", mobileRegisterSendOtp);
router.post("/user/mobile-register/verify-otp-only", (require("../controllers/auth.controller")).verifyRegistrationOtpOnly);
router.post("/user/mobile-register/verify-otp", mobileRegisterVerifyOtp);

// MOBILE LOGIN (Existing user login with OTP)
router.post("/user/mobile-login/send-otp", mobileLoginSendOtp);
router.post("/user/mobile-login/verify-otp", mobileLoginVerifyOtp);

// ADMIN LOGIN
router.post("/admin/login", adminLogin);

module.exports = router;

