import dotenv from "dotenv";
import path from "node:path";

// Resolve configuration from the backend directory even when launched from the repo root.
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local") });
