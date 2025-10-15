import request from "supertest";
import app from "../app";
import { registerUser, loginUser, createSeller, createCustomer, createInvoice, createProduct } from "../tests/getTestUtils";
import pool from "../db";

jest.setTimeout(80000); // 80 seconds timeout for long-running tests

describe("GET /products", () => {
  let token: string;
  let invoiceId: number;
  let productId: number;
  let seller: { id: number, name: string, address: string, abn: number }
  let customer: { id: number, name: string, address: string, abn?: number }

  beforeAll(async () => {
    await registerUser("seller@example.com", "password");
    token = await loginUser("seller@example.com", "password");
    seller = await createSeller(token, "Test Seller Pty Ltd", "123 Seller St", 51824753556);
    customer = await createCustomer(token, "Test Customer Pty Ltd", "456 Customer St", 91841570529);
    invoiceId = await createInvoice(token, seller, customer);
    productId = await createProduct(token, invoiceId, "Test Product", 10, 100);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM INVOICES WHERE id = $1", [invoiceId]);
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
    await pool.end();
  });

  it("should return a 400 status due to missing parameters", async () => {
    const response = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${token}`)
      .query({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid or missing invoice_id or product_id");
  });

  it("should return a 400 status for invalid invoice_id or product_id format", async () => {
    const response = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: "invalid-invoice", product_id: "invalid-product" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid or missing invoice_id or product_id");
  });

  it("should return a 404 status if product does not exist", async () => {
    const response = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: 999999, product_id: 999999 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found");
  });

  it("should return a 200 status and the product details using invoice_id and product_id", async () => {
    const response = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: invoiceId, product_id: productId });

    expect(response.status).toBe(200);
    expect(response.body.invoice_id).toBe(invoiceId);
    expect(response.body.product_id).toBe(productId);
    expect(response.body.description).toBe("Test Product");
    expect(response.body.quantity).toBe(10);
    expect(response.body.rate).toBe(100);
  });

  it("should return a 401 status if no authentication token is provided", async () => {
    const response = await request(app)
      .get("/products")
      .query({ invoice_id: invoiceId, product_id: productId });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized: No token provided");
  });
});
