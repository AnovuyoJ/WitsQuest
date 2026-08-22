import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../services/supabaseAdminClient";

// Extend Express's Request type so req.user is recognized by TypeScript
// wherever this middleware has run.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

/**
 * Verifies the Supabase access token sent in the Authorization header
 * (format: "Bearer <token>") and attaches the authenticated user to
 * req.user. Rejects the request if the token is missing or invalid.
 *
 * Use this on any backend route that needs to know *who* is making
 * the request (e.g. verify-location, submit-answer, delete-account).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }

  req.user = {
    id: data.user.id,
    ...(data.user.email ? { email: data.user.email } : {}),
  };

  next();
}