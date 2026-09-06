import "./config";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import catalogRouter from "./routes/catalog";
import adminRouter from "./routes/admin";
import gamesRouter from "./routes/games";
import verifyLocationRouter from "./routes/events/verifyLocation";
import submitAnswerRouter from "./routes/events/submitAnswer";
import accountRouter from "./routes/account";
import { HttpError } from "./services/validation";

export const app = express();
app.disable("x-powered-by");
const frontendOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
app.use(cors({ origin: frontendOrigins }));
app.use(express.json({ limit: "32kb" }));
app.use((req, _res, next) => { req.body ??= {}; next(); });
app.use("/api/admin", adminRouter);
app.use("/api/games", gamesRouter);
app.use("/api/events", verifyLocationRouter, submitAnswerRouter);
app.use("/api", accountRouter);
app.use("/api", catalogRouter);
app.get("/", (_req, res) => { res.json({ message: "Campus Quest backend is running." }); });
app.use((_req, res) => { res.status(404).json({ message: "Route not found." }); });
const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) { res.status(error.status).json({ message: error.message }); return; }
  if (error.type === "entity.parse.failed") { res.status(400).json({ message: "Invalid JSON body." }); return; }
  if (error.type === "entity.too.large") { res.status(413).json({ message: "Request body is too large." }); return; }
  if (error.code === "23503" || error.code === "23505") {
    res.status(409).json({ message: "This operation conflicts with existing records.", code: error.code }); return;
  }
  console.error("API request failed", {
    name: error.name, code: error.code,
    method: _req.method, route: _req.route?.path,
    // Schema errors identify the missing relation/column without logging request data or SQL parameters.
    ...(["42P01", "42703"].includes(error.code) ? { message: error.message } : {}),
  });
  res.status(500).json({ message: "The server could not complete the request." });
};
app.use(handleError);
