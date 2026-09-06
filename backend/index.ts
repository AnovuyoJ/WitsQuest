import { app } from "./app";

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to the backend PostgreSQL connection string.");
const port = process.env.PORT || 5000;
app.listen(port, () => { console.log(`Server running on port ${port}`); });
