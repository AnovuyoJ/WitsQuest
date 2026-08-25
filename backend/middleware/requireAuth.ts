import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../services/supabaseAdminClient";

const ADMIN_GITHUB_USERNAMES = ["anovuyoj", "lerato", "nessaforealz"];

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        isAdmin: boolean;
      };
    }
  }
}

function getGitHubUsernameCandidates(user: any): string[] {
  if (!user) return [];

  const values = [
    user?.user_metadata?.user_name,
    user?.user_metadata?.login,
    user?.user_metadata?.preferred_username,
    user?.email?.split("@")[0],
    ...(user?.identities?.map((i: any) => i?.identity_data?.user_name) ?? []),
    ...(user?.identities?.map((i: any) => i?.identity_data?.login) ?? []),
    ...(user?.identities?.map((i: any) => i?.identity_data?.preferred_username) ?? []),
  ];

  return values
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verifies the Supabase access token and attaches the authenticated user
 * (including a server-computed isAdmin flag) to req.user.
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

  const candidates = getGitHubUsernameCandidates(data.user);

  req.user = {
    id: data.user.id,
    ...(data.user.email ? { email: data.user.email } : {}),
    isAdmin: candidates.some((c) => ADMIN_GITHUB_USERNAMES.includes(c)),
  };

  next();
}

/**
 * Chain after requireAuth on any admin-only route.
 * Usage: router.post("/", requireAuth, requireAdmin, handler)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}