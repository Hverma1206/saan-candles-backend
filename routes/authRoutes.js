import express from "express";
import { sendOtp, verifyOtp, registerUser, signup, login, getMe } from "../controllers/authController.js";
import { validateSignup, validateLogin } from "../middleware/validate.js";

const router = express.Router();

router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.get("/me", getMe);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);

export default router;
