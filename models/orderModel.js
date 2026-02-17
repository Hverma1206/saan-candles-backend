import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    candle: { type: mongoose.Schema.Types.ObjectId, ref: "Candle", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], required: true, validate: [(v) => v.length > 0, "Order must have at least one item"] },
    shippingAddress: { type: shippingAddressSchema, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "cod" }, // cash on delivery for now
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema, "orders");

export default Order;
