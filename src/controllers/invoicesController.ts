
import { Request, Response } from "express";
import pool from "../db";
import { customerIsValid, sellerIsValid } from "../helpers";
import { AuthenticatedRequest } from "../middleware/auth";


export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id } = req.query;
    const userId = req.user?.userId;

    // Validate invoice_id
    if (!invoice_id) {
      res.status(400).json({ error: "Invalid or missing invoice_id" });
      return;
    }

    // Query to get invoice details
    const invoiceQuery = `
      SELECT
        i.id AS invoice_id,
        s.id AS seller_id,
        s.name AS seller_name,
        s.address AS seller_address,
        s.abn AS seller_abn,
        c.id AS customer_id,
        c.name AS customer_name,
        c.address AS customer_address,
        c.abn AS customer_abn
      FROM INVOICES i
      INNER JOIN SELLERS s ON i.seller_id = s.id
      INNER JOIN CUSTOMERS c ON i.customer_id = c.id
      WHERE i.id = $1 AND s.user_id = $2
    `;

    const result = await pool.query(invoiceQuery, [invoice_id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const invoice = result.rows[0];

    res.status(200).json({
      invoice_id: invoice.invoice_id,
      sellerDetails: {
        id: invoice.seller_id,
        name: invoice.seller_name,
        address: invoice.seller_address,
        abn: invoice.seller_abn,
      },
      customerDetails: {
        id: invoice.customer_id,
        name: invoice.customer_name,
        address: invoice.customer_address,
        abn: invoice.customer_abn,
      },
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred while getting the invoice" });
  }
};


export const createInvoices = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { seller, customer } = req.body;
    const userId = req.user?.userId;
    if (
      !(await sellerIsValid({ ...seller, user_id: userId })) ||
      !(await customerIsValid({ ...customer, user_id: userId }))
    ) {
      res.status(400).json({ error: "Invalid fields" });
      return;
    }
    const invoice = await pool.query(
      "INSERT INTO INVOICES (seller_id, customer_id) VALUES ($1, $2) RETURNING id",
      [seller.id, customer.id]
    );
    const { id } = invoice.rows[0];
    res.status(201).json({
      invoice_id: id,
      sellerDetails: {
        id: seller.id,
        name: seller.name,
        abn: seller.abn,
        address: seller.address,
      },
      customerDetails: {
        id: customer.id,
        name: customer.name,
        abn: customer.abn,
        address: customer.address,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};
export const editInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id } = req.params;
    const { seller, customer } = req.body;
    const userId = req.user?.userId;
    const sellerQuery = await pool.query("SELECT * FROM SELLERS WHERE id = $1", [
      seller.id,
    ]);
    if (
      !seller ||
      !seller.id ||
      !seller.abn ||
      !seller.name ||
      !seller.address ||
      sellerQuery.rows.length === 0
    ) {
      res.status(400).json({ error: "Invalid fields" });
      return;
    }
    const customerQuery = await pool.query("SELECT * FROM CUSTOMERS WHERE id = $1", [
      customer.id,
    ]);
    if (
      !customer ||
      !customer.id ||
      !customer.name ||
      !customer.address ||
      customerQuery.rows.length === 0
    ) {
      res.status(400).json({ error: "Invalid fields" });
      return;
    }

    const invoiceQuery = await pool.query(
      "SELECT * FROM INVOICES WHERE id = $1",
      [invoice_id]
    );

    if (invoiceQuery.rows.length === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    await pool.query(
      "UPDATE INVOICES SET seller_id = $1, customer_id = $2 WHERE id = $3",
      [seller.id, customer.id, invoice_id]
    );

    res.status(200).json({
      invoice_id: invoice_id,
      sellerDetails: {
        id: seller.id,
        name: seller.name,
        abn: seller.abn,
        address: seller.address,
      },
      customerDetails: {
        id: customer.id,
        name: customer.name,
        abn: customer.abn,
        address: customer.address,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};


export const deleteInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id } = req.params; // Get invoice_id from route parameters
    const user_id = req.user?.userId;

    if (!invoice_id) {
      res.status(400).json({ error: "Invoice ID is required" });
      return;
    }

    // Check if the invoice exists
    const invoiceQuery = await pool.query(
      "SELECT * FROM INVOICES WHERE id = $1 AND seller_id = $2",
      [invoice_id, user_id]
    );

    if (invoiceQuery.rows.length === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Delete the invoice
    await pool.query("DELETE FROM INVOICES WHERE id = $1 AND seller_id = $2", [
      invoice_id,
      user_id,
    ]);

    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};
