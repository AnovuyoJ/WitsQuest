import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import verifyLocationRouter from "./routes/events/verifyLocation";
import submitAnswerRouter from "./routes/events/submitAnswer";
import accountRouter from './routes/account';
dotenv.config();
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/events", verifyLocationRouter);
app.use("/api/events", submitAnswerRouter);
app.use('/api', accountRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Campus Quest backend is running." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});