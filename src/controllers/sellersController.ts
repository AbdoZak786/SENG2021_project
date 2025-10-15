import { Response } from "express";
import pool from "../db";
import { isValidABN } from "../helpers";
import { AuthenticatedRequest } from "../middleware/auth";




export const getSeller = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { abn, name } = req.query;
    const userId = req.user?.userId;

    if (!abn && !name) {
      res.status(400).json({ error: "ABN or name is required" });
      return;
    }

    let sellerQuery: string = "";
    let sellerParams: any[] = [];

    if (abn) {
      if (!isValidABN(String(abn))) {
        res.status(400).json({ error: "Invalid ABN" });
        return;
      }
      sellerQuery = `
        SELECT name AS name, address, CAST(abn AS TEXT) AS abn
        FROM SELLERS WHERE abn = $1 AND user_id = $2`;
      sellerParams = [abn, userId];
    } else if (name) {
      sellerQuery = `
        SELECT name AS name, address, CAST(abn AS TEXT) AS abn
        FROM SELLERS WHERE name ILIKE $1 AND user_id = $2`;
      sellerParams = [name, userId];
    }

    const result = await pool.query(sellerQuery, sellerParams);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Seller not found" });
      return;
    }

    const seller = result.rows[0];

    res.status(200).json(seller);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred while getting the seller" });
  }
};

export const createSeller = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { name, address, abn } = req.body;
    const userId = req.user?.userId;
    if (!name || !address || !abn) {
      res.status(400).json({ error: "Missing name or address or abn field" });
      return;
    } else if (!isValidABN(String(abn))) {
      res.status(400).json({ error: "Invalid ABN" });
      return;
    }
    const sellerQuery = await pool.query(
      "SELECT * FROM SELLERS WHERE name = $1 AND address = $2 AND user_id = $3 AND abn = $4",
      [name, address, userId, abn]
    );
    if (sellerQuery.rows.length > 0) {
      res
        .status(409)
        .json({ error: "Seller with those credentials already exists" });
      return;
    }
    const seller = await pool.query(
      "INSERT INTO SELLERS (user_id, abn, name, address) VALUES ($1, $2, $3, $4) RETURNING id, abn, name, address",
      [userId, abn, name, address]
    );
    const { id } = seller.rows[0];

    res.status(201).json({ id: id, name, address, abn: Number(abn) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};
export const editSeller = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, abn } = req.body;
    const userId = req.user?.userId;
    if (!name || !address || !abn || !id) {
      res.status(400).json({ error: "Missing name, address, id, or abn field" });
      return;
    } else if (!isValidABN(String(abn))) {
      res.status(400).json({ error: "Invalid ABN" });
      return;
    }

    // Check if the seller exists
    const sellerQuery = await pool.query(
      "SELECT * FROM SELLERS WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (sellerQuery.rows.length === 0) {
      res.status(404).json({ error: "Seller not found" });
      return;
    }

    // Update the seller's details
    const updatedSeller = await pool.query(
      "UPDATE SELLERS SET name = $1, address = $2, abn = $3 WHERE id = $4 AND user_id = $5 RETURNING abn, name, address",
      [name, address, abn, id, userId]
    );

    res
      .status(200)
      .json(updatedSeller.rows[0]);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "An error occurred while editing the seller" });
  }
};

export const deleteSeller = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { abn } = req.params;
    const userId = req.user?.userId;

    if (!abn) {
      res.status(404).json({ error: "Seller with ABN does not exist" });
      return;
    }

    // Check if the seller exists
    const sellerQuery = await pool.query(
      "SELECT * FROM SELLERS WHERE abn = $1 AND user_id = $2",
      [abn, userId]
    );

    if (sellerQuery.rows.length === 0) {
      res.status(404).json({ error: "Seller not found" });
      return;
    }

    // Delete seller
    await pool.query("DELETE FROM SELLERS WHERE abn = $1 AND user_id = $2", [abn, userId]);

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occured while deleting the seller" });
  }
}
