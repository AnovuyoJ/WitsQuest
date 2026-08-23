import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import verifyLocationRouter from "./routes/events/verifyLocation";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/events", verifyLocationRouter);

// Simple health check — useful to confirm the server is actually running
app.get("/", (_req, res) => {
  res.json({ message: "Campus Quest backend is running." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});