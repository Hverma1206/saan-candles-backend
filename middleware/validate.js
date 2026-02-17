// Validation middleware matching frontend rules

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10,15}$/; // 10–15 digits

const err = (res, message) =>
  res.status(400).json({ success: false, message });

/** POST /api/auth/signup */
export const validateSignup = (req, res, next) => {
  const { name, email, phoneNumber, password, repeatPassword } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return err(res, "Name must be at least 2 characters");
  }

  if (!email || !emailRegex.test(email)) {
    return err(res, "Please enter a valid email address");
  }

  if (!phoneNumber || !phoneRegex.test(phoneNumber.replace(/[\s\-()]/g, ""))) {
    return err(res, "Please enter a valid phone number (10 digits)");
  }

  if (!password || password.length < 6) {
    return err(res, "Password must be at least 6 characters");
  }

  // If the frontend sends repeatPassword, verify match
  if (repeatPassword !== undefined && password !== repeatPassword) {
    return err(res, "Passwords do not match");
  }

  // Sanitise
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phoneNumber = phoneNumber.trim();

  next();
};

/** POST /api/auth/login */
export const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || typeof identifier !== "string" || identifier.trim().length === 0) {
    return err(res, "Email or phone number is required");
  }

  if (!password || password.length < 1) {
    return err(res, "Password is required");
  }

  req.body.identifier = identifier.trim().toLowerCase();

  next();
};
