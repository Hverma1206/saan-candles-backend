import User from "../models/userModel.js";
import { generateOtp, sendOtpEmail } from "../utils/emailService.js";
import dotenv from "dotenv";

dotenv.config();

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
