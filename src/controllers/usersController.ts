import pool, { JWT_SECRET } from "../db";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middleware/auth";

export const registerUsers = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ error: "Bad request, missing email or password field" });
      return;
    }
    const existingUser = await pool.query(
      "SELECT * FROM USERS WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "User already exists" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO USERS (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );

    const token = jwt.sign({ userId: newUser.rows[0].id }, JWT_SECRET);
    res.status(201).json({ user: newUser.rows[0], token });
    return;
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
    return;
  }
};

export const loginUsers = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ error: "Bad request, missing email or password field" });
      return;
    }
    const userQuery = await pool.query("SELECT * FROM USERS WHERE email = $1", [
      email,
    ]);
    if (userQuery.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.status(200).json({ message: "Login successful", token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
    return;
  }
};


export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Check if the seller exists
    const userQuery = await pool.query(
      "SELECT * FROM USERS WHERE user_id = $1", [userId]);

    if (userQuery.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete seller
    await pool.query("DELETE FROM USERS WHERE user_id = $1", [userId]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occured while deleting the user" });
  }
}