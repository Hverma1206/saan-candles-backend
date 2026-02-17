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

/** POST /api/orders – place a new order */
export const validateOrder = (req, res, next) => {
  const { items, shippingAddress } = req.body;

  // ── Items ─────────────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return err(res, "Order must contain at least one item");
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.candleId || typeof item.candleId !== "string") {
      return err(res, `Item ${i + 1}: candle ID is required`);
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1 || !Number.isInteger(item.quantity)) {
      return err(res, `Item ${i + 1}: quantity must be a positive integer`);
    }
  }

  // ── Shipping address ──────────────────────────────────────────
  if (!shippingAddress || typeof shippingAddress !== "object") {
    return err(res, "Shipping address is required");
  }

  const { firstName, lastName, address, city, state, zipCode, phone } = shippingAddress;

  if (!firstName || typeof firstName !== "string" || firstName.trim().length < 1) {
    return err(res, "First name is required");
  }
  if (!lastName || typeof lastName !== "string" || lastName.trim().length < 1) {
    return err(res, "Last name is required");
  }
  if (!address || typeof address !== "string" || address.trim().length < 3) {
    return err(res, "Address must be at least 3 characters");
  }
  if (!city || typeof city !== "string" || city.trim().length < 2) {
    return err(res, "City is required");
  }
  if (!state || typeof state !== "string" || state.trim().length < 2) {
    return err(res, "State is required");
  }
  if (!zipCode || typeof zipCode !== "string" || !/^[0-9]{5,6}$/.test(zipCode.trim())) {
    return err(res, "ZIP code must be 5 or 6 digits");
  }
  if (!phone || !phoneRegex.test(phone.replace(/[\s\-()]/g, ""))) {
    return err(res, "Please enter a valid phone number");
  }

  // Sanitise
  req.body.shippingAddress = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    zipCode: zipCode.trim(),
    phone: phone.trim(),
  };

  next();
};
