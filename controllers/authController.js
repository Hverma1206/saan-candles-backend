import User from "../models/userModel.js";
import { generateOtp, sendOtpEmail } from "../utils/emailService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Signup (password-based) ───────────────────────────────────────
export const signup = async (req, res) => {
  const { name, email, phoneNumber, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      verified: true,
    });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Signup successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
};

// ─── Login (password-based) ────────────────────────────────────────
export const login = async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or phone

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Email/phone and password are required" });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: "No password set. Use OTP login." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ─── Get current user (token-based) ───────────────────────────────
export const getMe = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
    });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const sendOtp = async (req, res) => {
  const { email, name } = req.body;
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }

  try {
    console.log(`Generating OTP for email: ${email}`);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, verified: false });
    }
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.verified = false;
    await user.save();

    await sendOtpEmail(email, otp);
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    if (user.otp === otp && user.otpExpires > new Date()) {
      user.verified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.json({ success: true, message: "Email verified successfully" });
    }

    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

export const registerUser = async (req, res) => {
  const { email, name, phoneNumber, address } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ success: false, message: "Email and name are required" });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found. Please request OTP first." });
    }
    
    if (!user.verified) {
      return res.status(400).json({ success: false, message: "Email not verified. Please verify your email first." });
    }
    
    user.name = name;
    user.phoneNumber = phoneNumber;
    user.address = address;
    await user.save();
    
    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};
