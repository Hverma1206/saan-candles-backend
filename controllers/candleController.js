import Candle from "../models/candleModel.js";
import fs from "fs";
import path from "path";

// CREATE a new candle
export const createCandle = async (req, res) => {
  try {
    const { title, description, price, weight, height, width, category, fragrance, color, burnTime, material, stock } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ success: false, message: "Title, description and price are required" });
    }

    const candleData = {
      title,
      description,
      price: Number(price),
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
      width: width ? Number(width) : undefined,
      category,
      fragrance,
      color,
      burnTime,
      material,
      stock: stock ? Number(stock) : 0,
    };

    if (req.file) {
      candleData.photo = `/uploads/${req.file.filename}`;
    }

    const candle = new Candle(candleData);
    await candle.save();

    res.status(201).json({ success: true, message: "Candle created successfully", candle });
  } catch (err) {
    console.error("Error creating candle:", err);
    res.status(500).json({ success: false, message: "Failed to create candle" });
  }
};

// GET all candles
export const getAllCandles = async (req, res) => {
  try {
    const candles = await Candle.find().sort({ createdAt: -1 });
    res.json({ success: true, candles });
  } catch (err) {
    console.error("Error fetching candles:", err);
    res.status(500).json({ success: false, message: "Failed to fetch candles" });
  }
};

// GET single candle by id
export const getCandleById = async (req, res) => {
  try {
    const candle = await Candle.findById(req.params.id);
    if (!candle) return res.status(404).json({ success: false, message: "Candle not found" });
    res.json({ success: true, candle });
  } catch (err) {
    console.error("Error fetching candle:", err);
    res.status(500).json({ success: false, message: "Failed to fetch candle" });
  }
};

// UPDATE a candle
export const updateCandle = async (req, res) => {
  try {
    const { title, description, price, weight, height, width, category, fragrance, color, burnTime, material, stock, active } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (weight !== undefined) updateData.weight = Number(weight);
    if (height !== undefined) updateData.height = Number(height);
    if (width !== undefined) updateData.width = Number(width);
    if (category !== undefined) updateData.category = category;
    if (fragrance !== undefined) updateData.fragrance = fragrance;
    if (color !== undefined) updateData.color = color;
    if (burnTime !== undefined) updateData.burnTime = burnTime;
    if (material !== undefined) updateData.material = material;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (active !== undefined) updateData.active = active === "true" || active === true;

    if (req.file) {
      // Delete old photo if exists
      const existing = await Candle.findById(req.params.id);
      if (existing?.photo) {
        const oldPath = path.join(process.cwd(), existing.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    const candle = await Candle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!candle) return res.status(404).json({ success: false, message: "Candle not found" });

    res.json({ success: true, message: "Candle updated successfully", candle });
  } catch (err) {
    console.error("Error updating candle:", err);
    res.status(500).json({ success: false, message: "Failed to update candle" });
  }
};

// DELETE a candle
export const deleteCandle = async (req, res) => {
  try {
    const candle = await Candle.findByIdAndDelete(req.params.id);
    if (!candle) return res.status(404).json({ success: false, message: "Candle not found" });

    // Delete photo file
    if (candle.photo) {
      const photoPath = path.join(process.cwd(), candle.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    res.json({ success: true, message: "Candle deleted successfully" });
  } catch (err) {
    console.error("Error deleting candle:", err);
    res.status(500).json({ success: false, message: "Failed to delete candle" });
  }
};
