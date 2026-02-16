import express from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import {
  createCandle,
  getAllCandles,
  getCandleById,
  updateCandle,
  deleteCandle,
} from "../controllers/candleController.js";

const router = express.Router();

// Cloudinary multer storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "saan-candles",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

router.post("/", upload.single("photo"), createCandle);
router.get("/", getAllCandles);
router.get("/:id", getCandleById);
router.put("/:id", upload.single("photo"), updateCandle);
router.delete("/:id", deleteCandle);

export default router;
