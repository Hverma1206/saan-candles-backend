import mongoose from "mongoose";

const candleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    weight: { type: Number }, // in grams
    height: { type: Number }, // in cm
    width: { type: Number }, // in cm
    category: { type: String, trim: true },
    fragrance: { type: String, trim: true },
    color: { type: String, trim: true },
    burnTime: { type: String }, // e.g. "40-50 hours"
    material: { type: String, trim: true }, // e.g. "Soy Wax", "Beeswax"
    stock: { type: Number, default: 0, min: 0 },
    photo: { type: String }, // file path / URL
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Candle = mongoose.model("Candle", candleSchema, "candles");

export default Candle;
