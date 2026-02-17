import express from "express" 
import mongoose from "mongoose"
import dotenv from "dotenv"
import bodyParser from "body-parser";
import cors from "cors"
import "./utils/cloudinary.js"
import authRoutes from "./routes/authRoutes.js"
import candleRoutes from "./routes/candleRoutes.js"

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { dbName: "products" })
  .then(() => console.log("MongoDB connected to 'products' database"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/candles", candleRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
