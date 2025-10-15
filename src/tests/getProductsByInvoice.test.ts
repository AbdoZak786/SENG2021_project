import request from "supertest";
import app from "../app";
import { registerUser, loginUser, createSeller, createCustomer, createInvoice, createProduct } from "../tests/getTestUtils";
import pool from "../db";

jest.setTimeout(80000); // 80 seconds timeout for long-running tests

describe("GET /invoice-products", () => {
  let token: string;
  let invoiceId: number;
  let productIds: number[] = [];
  let seller: { id: number, name: string, address: string, abn: number }
  let customer: { id: number, name: string, address: string, abn?: number }

  beforeAll(async () => {
    await registerUser("seller@example.com", "password");
    token = await loginUser("seller@example.com", "password");
    seller = await createSeller(token, "Test Seller Pty Ltd", "123 Seller St", 51824753556);
    customer = await createCustomer(token, "Test Customer Pty Ltd", "456 Customer St", 91841570529);
    invoiceId = await createInvoice(token, seller, customer);
    productIds.push(await createProduct(token, invoiceId, "Laptop", 1, 1200));
    productIds.push(await createProduct(token, invoiceId, "Mouse", 2, 20));
    productIds.push(await createProduct(token, invoiceId, "Keyboard", 1, 50));
  });

  afterAll(async () => {
    await pool.query("DELETE FROM INVOICES WHERE id = $1", [invoiceId]);
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
    await pool.end();
  });

  it("should return a 200 status and all products for the given invoice_id", async () => {
    const response = await request(app)
      .get("/products/:invoice_id")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: invoiceId });

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);

    expect(response.body[0].invoice_id).toBe(invoiceId);
    expect(response.body[1].invoice_id).toBe(invoiceId);
    expect(response.body[2].invoice_id).toBe(invoiceId);
  });

  it("should return a 400 status due to missing parameters", async () => {
    const response = await request(app)
      .get("/products/:invoice_id")
      .set("Authorization", `Bearer ${token}`)
      .query({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid or missing invoice_id");
  });

  it("should return a 400 status for invalid invoice_id format", async () => {
    const response = await request(app)
      .get("/products/:invoice_id")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: "invalid-invoice" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid or missing invoice_id");
  });

  it("should return a 404 status if no products exist for the invoice", async () => {
    const response = await request(app)
      .get("/products/:invoice_id")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: 999999 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Products not found");
  });

  it("should return a 401 status if no authentication token is provided", async () => {
    const response = await request(app)
      .get("/products/:invoice_id")
      .query({ invoice_id: invoiceId });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized: No token provided");
  });
});
