/**
 * This file contains helper functions for testing GET functions API endpoints using Supertest.
 * It provides utility functions for user authentication, customer and seller creation,
 * invoice generation, and product creation, ensuring API endpoints work correctly.
 */

import request from "supertest";
import app from "../app";

/**
 * Registers a new user with the given email and password.
 * Returns the response body containing user details.
 */
export const registerUser = async (email: string, password: string) => {
  const response = await request(app)
    .post("/users/register")
    .send({ email, password });
  return response.body;
};

/**
 * Logs in a user and retrieves the authentication token.
 * Throws an error if login fails.
 */
export const loginUser = async (email: string, password: string) => {
  const response = await request(app)
    .post("/users/login")
    .send({ email, password });

  return response.body.token;
};

/**
 * Creates a new customer with the provided details.
 * Requires authentication via token.
 * Returns the customer ID.
 */
export const createCustomer = async (token: string, name: string, address: string, abn: number) => {
  const response = await request(app)
    .post("/customers/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, address, abn });

  return response.body;
};

/**
 * Creates a new seller with the provided details.
 * Requires authentication via token.
 * Returns the seller ID.
 */
export const createSeller = async (token: string, name: string, address: string, abn: number) => {
  const response = await request(app)
    .post("/sellers/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, address, abn });
  return response.body;
};

/**
 * Creates an invoice for a seller and a customer.
 * Requires authentication via token.
 * Returns the invoice ID.
 */
export const createInvoice = async (token: string, seller: { id: number, name: string, address: string, abn: number }, customer: { id: number, name: string, address: string, abn?: number }) => {

  const response = await request(app)
    .post("/invoices/create")
    .set("Authorization", `Bearer ${token}`)
    .send({
      seller,
      customer,
    });
  return response.body.invoice_id;
};

/**
 * Creates a new product and links it to an invoice.
 * Requires authentication via token.
 * Returns the product ID.
 */
export const createProduct = async (
  token: string,
  invoiceId: number,
  description: string,
  quantity: number,
  rate: number
) => {
  const response = await request(app)
    .post("/products/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ invoice_id: invoiceId, description, quantity, rate });
  return response.body.product_id;
};

