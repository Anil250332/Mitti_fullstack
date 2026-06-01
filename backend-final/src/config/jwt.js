const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  // Token expiration removed as per requirement - token will stay valid until logout (client-side removal)
  return jwt.sign(payload, process.env.JWT_SECRET);
};

const extractToken = (req) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return { success: false, message: "Authorization token missing" };

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return { success: true, message: "Token extracted successfully.", Token: decoded };
  }
  catch (ex) {
    return { success: false, message: "Token is Invalid." };
  }
}

module.exports = { generateToken, extractToken };
