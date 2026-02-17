import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware that verifies the Bearer token and attaches `req.user`.
 * Returns 401 if the token is missing / invalid / user no longer exists.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required. Please log in." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -otp -otpExpires");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found. Please log in again." });
    }

    req.user = user; // attach full user doc (minus sensitive fields)
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid token. Please log in again." });
  }
};

export default authenticate;
