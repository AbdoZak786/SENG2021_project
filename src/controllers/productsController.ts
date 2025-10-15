import { Request, Response } from "express";
import pool from "../db";
import { AuthenticatedRequest } from "../middleware/auth";



export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id, product_id } = req.query;
    const userId = req.user?.userId;

    // Validate invoice_id and product_id
    if (!invoice_id || isNaN(Number(invoice_id)) || !product_id || isNaN(Number(product_id))) {
      res.status(400).json({ error: "Invalid or missing invoice_id or product_id" });
      return;
    }

    // Query to get a specific product associated with the invoice
    const productQuery = `
      SELECT
        p.invoice_id,
        p.id AS product_id,
        p.description,
        p.quantity,
        p.rate
      FROM PRODUCTS p
      INNER JOIN INVOICES i ON p.invoice_id = i.id
      INNER JOIN SELLERS s ON i.seller_id = s.id
      WHERE p.invoice_id = $1 AND p.id = $2 AND s.user_id = $3
    `;

    const result = await pool.query(productQuery, [invoice_id, product_id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const product = result.rows[0];

    res.status(200).json({
      invoice_id: product.invoice_id,
      product_id: product.product_id,
      description: product.description,
      quantity: product.quantity,
      rate: product.rate,
    });
    return;

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred while getting the product" });
  }
};

export const createProducts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { invoice_id, description, rate, quantity } = req.body;
    const user_id = req.user?.userId;
    if (!invoice_id || !description || !rate || !quantity) {
      res.status(400).json({ error: "Invalid fields" });
      return;
    }
    const invoiceQuery = await pool.query("SELECT * FROM INVOICES WHERE id = $1", [invoice_id])
    if (invoiceQuery.rows.length === 0) {
      res.status(400).json({ error: "Invalid invoice_id" });
      return
    }
    const productsQuery = await pool.query(
      "SELECT * FROM PRODUCTS WHERE invoice_id = $1",
      [invoice_id]
    );
    const productId = productsQuery.rows.length + 1;
    const product = await pool.query(
      "INSERT INTO PRODUCTS (id, invoice_id, description, rate, quantity) VALUES ($1, $2, $3, $4, $5)",
      [productId, invoice_id, description, rate, quantity]
    );
    res.status(201).json({
      product_id: productId,
      invoice_id,
      description,
      rate,
      quantity,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};

export const editProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id, product_id } = req.params;
    const { description, rate, quantity } = req.body;

    // Check for missing fields
    if (!invoice_id || !product_id || !description || !rate || !quantity) {
      res.status(400).json({ error: "Invalid fields" });
      return;
    }

    // Check if product exists
    const productQuery = await pool.query(
      "SELECT * FROM PRODUCTS WHERE invoice_id = $1 AND id = $2",
      [invoice_id, product_id]
    );

    if (productQuery.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Update product
    await pool.query(
      "UPDATE PRODUCTS SET description = $1, rate = $2, quantity = $3 WHERE invoice_id = $4 AND id = $5",
      [description, rate, quantity, invoice_id, product_id]
    );

    res.status(200).json({
      invoice_id,
      product_id,
      description,
      rate,
      quantity,
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "An error occurred while editing the product" });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id, product_id } = req.params;
    const user_id = req.user?.userId;

    if (!invoice_id || !product_id) {
      res.status(400).json({ error: "Invoice ID and Product ID are required" });
      return;
    }

    // Check if the product exists under the specified invoice
    const productQuery = await pool.query(
      "SELECT * FROM PRODUCTS WHERE id = $1 AND invoice_id = $2",
      [product_id, invoice_id]
    );

    if (productQuery.rows.length === 0) {
      res.status(404).json({ error: "Product not found in this invoice" });
      return;
    }

    // Delete the product
    await pool.query("DELETE FROM PRODUCTS WHERE id = $1 AND invoice_id = $2", [product_id, invoice_id]);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};


export const getProductsByInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id } = req.query;
    const userId = req.user?.userId;

    // Validate invoice_id
    if (!invoice_id || isNaN(Number(invoice_id))) {
      res.status(400).json({ error: "Invalid or missing invoice_id" });
      return;
    }

    // Query to get products associated with the invoice
    const productQuery = `
      SELECT
        p.invoice_id,
        p.id AS product_id,
        p.description,
        p.quantity,
        p.rate
      FROM PRODUCTS p
      INNER JOIN INVOICES i ON p.invoice_id = i.id
      INNER JOIN SELLERS s ON i.seller_id = s.id
      WHERE p.invoice_id = $1 AND s.user_id = $2
    `;

    const result = await pool.query(productQuery, [invoice_id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Products not found" });
      return;
    }

    const products = result.rows.map(product => ({
      invoice_id: product.invoice_id,
      product_id: product.product_id,
      description: product.description,
      quantity: product.quantity,
      rate: product.rate
    }));

    res.status(200).json((products));
    return;

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred while getting the products" });
  }
};
