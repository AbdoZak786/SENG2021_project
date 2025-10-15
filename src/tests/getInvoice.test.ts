import request from "supertest";
import app from "../app";
import { registerUser, loginUser, createSeller, createCustomer, createInvoice } from "../tests/getTestUtils";
import pool from "../db";
jest.setTimeout(80000); // 20 seconds timeout for long-running tests

describe("GET /invoices", () => {
  let token: string;
  let invoiceId: number;
  let seller: { id: number, name: string, address: string, abn: number }
  let customer: { id: number, name: string, address: string, abn?: number }

  beforeAll(async () => {
    await registerUser("seller@example.com", "password");
    token = await loginUser("seller@example.com", "password");
    seller = await createSeller(token, "Test Seller Pty Ltd", "123 Seller St", 51824753556);
    customer = await createCustomer(token, "Test Customer Pty Ltd", "456 Customer St", 91841570529);
    invoiceId = await createInvoice(token, seller, customer);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM INVOICES WHERE id = $1", [invoiceId]);
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
  });

  it("should return a 400 status due to missing parameters", async () => {
    const response = await request(app)
      .get("/invoices")
      .set("Authorization", `Bearer ${token}`)
      .query({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid or missing invoice_id");
  });


  it("should return a 404 status if invoice does not exist", async () => {
    const response = await request(app)
      .get("/invoices")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: "999999" });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Invoice not found");
  });

  it("should return a 200 status and the invoice details using invoice_id", async () => {
    const response = await request(app)
      .get("/invoices")
      .set("Authorization", `Bearer ${token}`)
      .query({ invoice_id: invoiceId });
    expect(response.status).toBe(200);

    expect(response.body.invoice_id).toBe(invoiceId);
    expect(response.body.sellerDetails.name).toBe("Test Seller Pty Ltd");
    expect(response.body.sellerDetails.address).toBe("123 Seller St");


    expect(typeof response.body.sellerDetails.abn).toBe("string");
    expect(response.body.sellerDetails.abn).toBe("51824753556");

    expect(response.body.customerDetails.name).toBe("Test Customer Pty Ltd");
    expect(response.body.customerDetails.address).toBe("456 Customer St");

    expect(typeof response.body.customerDetails.abn).toBe("string");
    expect(response.body.customerDetails.abn).toBe("91841570529");
  });

  it("should return a 401 status if no authentication token is provided", async () => {
    const response = await request(app)
      .get("/invoices")
      .query({ invoice_id: invoiceId });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized: No token provided");
  });
});
