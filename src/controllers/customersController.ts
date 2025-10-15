import { Request, Response } from "express";
import pool from "../db";
import { isValidABN } from "../helpers";
import { AuthenticatedRequest } from "../middleware/auth";

export const getCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { abn, name, address } = req.query;
    const userId = req.user?.userId;

    // Ensuring at least one parameter is provided
    if (!abn && (!name || !address)) {
      res.status(400).json({ error: "ABN or (name and address) is required" });
      return;
    }

    let customerQuery: string = "";
    let customerParams: any[] = [];

    // If ABN is provided, validate format
    if (abn) {
      if (!isValidABN(String(abn))) {
        res.status(400).json({ error: "Invalid ABN" });
        return;
      }
      customerQuery = "SELECT * FROM CUSTOMERS WHERE abn = $1 AND user_id = $2";
      customerParams = [abn, userId];
    }
    // If (name, address) is provided
    else if (name && address) {
      customerQuery = "SELECT * FROM CUSTOMERS WHERE name ILIKE $1 AND address ILIKE $2 AND user_id = $3";
      customerParams = [name.toString(), address.toString(), userId];
    }

    // Ensure query is not empty before executing
    if (!customerQuery) {
      res.status(500).json({ error: "An error occurred while building the query" });
      return;
    }

    // Query the database for the customer
    const result = await pool.query(customerQuery, customerParams);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const customer = result.rows[0];

    res.status(200).json({
      id: customer.id,
      name: customer.name,
      address: customer.address,
      abn: customer.abn,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred while retrieving the customer" });
  }
};

export const createCustomer = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { name, address, abn } = req.body;
    const userId = req.user?.userId;
    if (!name || !address) {
      res.status(400).json({ error: "Missing name or address field" });
      return;
    } else if (abn && !isValidABN(String(abn))) {
      res.status(400).json({ error: "Invalid ABN" });
      return;
    }
    const customerQuery = await pool.query(
      "SELECT * FROM CUSTOMERS WHERE name = $1 AND address = $2 AND user_id = $3 AND (abn = $4 OR ($4 IS NULL AND abn IS NULL))",
      [name, address, userId, abn]
    );
    if (customerQuery.rows.length > 0) {
      res
        .status(409)
        .json({ error: "Customer with those credentials already exists" });
      return;
    }
    const customer = await pool.query(
      "INSERT INTO CUSTOMERS (user_id, abn, name, address) VALUES ($1, $2, $3, $4) RETURNING id, abn, name, address",
      [userId, abn, name, address]
    );
    const { id } = customer.rows[0];

    res.status(201).json({ id: id, name, address, abn: Number(abn) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};
export const editCustomer = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { customer_id } = req.params;
    const { name, address, abn } = req.body;

    const existingCustomer = await pool.query(
      "SELECT * FROM CUSTOMERS WHERE id = $1",
      [customer_id]
    );
    if (existingCustomer.rows.length === 0) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    // Update the customer
    const updatedCustomer = await pool.query(
      "UPDATE CUSTOMERS SET name = $1, address = $2, abn = $3 WHERE id = $4 RETURNING *",
      [
        name || existingCustomer.rows[0].name,
        address || existingCustomer.rows[0].address,
        abn || existingCustomer.rows[0].abn,
        customer_id,
      ]
    );

    res.status(200).json(updatedCustomer.rows[0]);
    return;
  } catch (error) {
    console.error("Error updating customer:", error);
    res
      .status(500)
      .json({ error: "An error occurred while editing the customer" });
    return;
  }
};


export const deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customer_id } = req.params;
    const user_id = req.user?.userId;

    if (!customer_id) {
      res.status(400).json({ error: "customer ID is required" });
      return;
    }

    // Check if the product exists under the specified invoice
    const productQuery = await pool.query(
      "SELECT * FROM CUSTOMERS WHERE customer_id = $1",
      [customer_id]
    );

    if (productQuery.rows.length === 0) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    // Delete the product
    await pool.query("DELETE FROM CUSTOMERS WHERE customer_id = $1", [customer_id]);

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}