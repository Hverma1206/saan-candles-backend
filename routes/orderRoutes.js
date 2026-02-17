import express from "express";
import authenticate from "../middleware/authenticate.js";
import { validateOrder } from "../middleware/validate.js";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// ── Admin routes (no auth for now — admin panel is internal) ──
router.get("/admin/all", getAllOrders);
router.get("/admin/:id", getOrderByIdAdmin);
router.put("/admin/:id/status", updateOrderStatus);

// ── User routes (require authentication) ─────────────────────
router.use(authenticate);

router.post("/", validateOrder, placeOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);

export default router;
