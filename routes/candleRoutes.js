import express from "express";
import multer from "multer";
import path from "path";
import {
  createCandle,
  getAllCandles,
  getCandleById,
  updateCandle,
  deleteCandle,
} from "../controllers/candleController.js";

const router = express.Router();

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

router.post("/", upload.single("photo"), createCandle);
router.get("/", getAllCandles);
router.get("/:id", getCandleById);
router.put("/:id", upload.single("photo"), updateCandle);
router.delete("/:id", deleteCandle);

export default router;
