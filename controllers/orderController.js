import Order from "../models/orderModel.js";
import Candle from "../models/candleModel.js";
import { sendOrderNotificationEmail, sendOrderConfirmationEmail } from "../utils/emailService.js";

/**
 * POST /api/orders
 * Place a new order. Requires authenticated user (req.user set by middleware).
 *
 * Validation flow:
 *  1. authenticate middleware → ensures valid JWT, attaches req.user
 *  2. validateOrder middleware → ensures body shape & sanitisation
 *  3. this controller → verifies candles exist, checks stock, computes total server-side
 */
export const placeOrder = async (req, res) => {
  const { items, shippingAddress } = req.body;
  const user = req.user;

  try {
    // ── Look up each candle and validate stock / active status ───
    const candleIds = items.map((i) => i.candleId);
    const candles = await Candle.find({ _id: { $in: candleIds } });

    if (candles.length !== candleIds.length) {
      const foundIds = new Set(candles.map((c) => c._id.toString()));
      const missing = candleIds.filter((id) => !foundIds.has(id));
      return res.status(400).json({
        success: false,
        message: `Some products were not found: ${missing.join(", ")}`,
      });
    }

    // Build a lookup map
    const candleMap = Object.fromEntries(candles.map((c) => [c._id.toString(), c]));

    // Validate each item
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const candle = candleMap[item.candleId];

      if (candle.active === false) {
        return res.status(400).json({
          success: false,
          message: `"${candle.title}" is no longer available`,
        });
      }

      if (candle.stock !== undefined && candle.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${candle.title}". Only ${candle.stock} left.`,
        });
      }

      const lineTotal = candle.price * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        candle: candle._id,
        title: candle.title,
        price: candle.price, // use server-side price, never trust client price
        quantity: item.quantity,
      });
    }

    // ── Create order ────────────────────────────────────────────
    const order = new Order({
      user: user._id,
      email: user.email,
      items: orderItems,
      shippingAddress,
      totalAmount,
    });

    await order.save();

    // ── Send email notification to admin ────────────────────────
    sendOrderNotificationEmail(order).catch((err) =>
      console.error("Admin email notification failed (non-blocking):", err)
    );

    // ── Send order confirmation email to the customer ───────────
    sendOrderConfirmationEmail(order).catch((err) =>
      console.error("Customer confirmation email failed (non-blocking):", err)
    );

    // ── Decrease stock ──────────────────────────────────────────
    for (const item of items) {
      await Candle.findByIdAndUpdate(item.candleId, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

/**
 * GET /api/orders
 * Fetch orders for the logged-in user.
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/**
 * GET /api/orders/:id
 * Fetch a single order – only if it belongs to the logged-in user.
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Ensure the order belongs to the requesting user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/orders/admin/all
 * Fetch every order (newest first) with user info populated.
 * Supports optional query params: ?status=pending&page=1&limit=20
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/**
 * GET /api/orders/admin/:id
 * Fetch a single order by ID (admin view — no ownership check).
 */
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email phoneNumber"
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (err) {
    console.error("Error fetching order (admin):", err);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

/**
 * PUT /api/orders/admin/:id/status
 * Update an order's status.  Body: { status: "confirmed" | "shipped" | "delivered" | "cancelled" }
 */
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  if (!status || !allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed: ${allowed.join(", ")}`,
    });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email phoneNumber");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Status updated", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};
