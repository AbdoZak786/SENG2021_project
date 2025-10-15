import pool, { JWT_SECRET } from "../db";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


export interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}

export const validateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await pool.query("SELECT * FROM USERS WHERE id = $1", [
      decoded.userId,
    ]);
    if (user.rows.length === 0) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = decoded;
    next();
  } catch (e) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};