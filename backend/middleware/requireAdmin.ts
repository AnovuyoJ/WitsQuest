import { Request, Response, NextFunction } from "express";

export function isAdministrator(id: string): boolean {
  return (process.env.ADMIN_USER_IDS ?? "").split(",").map(value => value.trim()).includes(id);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !isAdministrator(req.user.id)) {
    return res.status(403).json({ message: "Administrator access required." });
  }
  next();
}
