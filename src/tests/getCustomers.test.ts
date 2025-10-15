import request from "supertest";
import app from "../app";
import { registerUser, loginUser, createCustomer } from "../tests/getTestUtils";
import pool from "../db";

describe("GET /customers", () => {
  let token: string;
  let customer: { id: number, name: string, address: string, abn?: number };

  beforeAll(async () => {
    // Register and login user
    await registerUser("customer@example.com", "password");
    token = await loginUser("customer@example.com", "password");

    customer = await createCustomer(token, "Test Customer Pty Ltd", "456 Customer St", 51824753556);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
  });

  it("should return a 400 status due to missing parameters", async () => {
    const response = await request(app)
      .get("/customers")
      .set("Authorization", `Bearer ${token}`)
      .query({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("ABN or (name and address) is required");
  });

  it("should return a 400 status for invalid ABN format", async () => {
    const response = await request(app)
      .get("/customers")
      .set("Authorization", `Bearer ${token}`)
      .query({ abn: "invalid-abn" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid ABN");
  });

  it("should return a 404 status if customer does not exist", async () => {
    const response = await request(app)
      .get("/customers")
      .set("Authorization", `Bearer ${token}`)
      .query({ abn: "10000000000" });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Customer not found");
  });

  it("should return a 200 status and the customer details using ABN", async () => {
    const response = await request(app)
      .get("/customers")
      .set("Authorization", `Bearer ${token}`)
      .query({ abn: "51824753556" });
    expect(response.status).toBe(200);
    expect(response.body.abn).toBe("51824753556");
    expect(response.body.name).toBe("Test Customer Pty Ltd");
    expect(response.body.address).toBe("456 Customer St");
  });

  it("should return a 200 status and the customer details using name and address", async () => {
    const response = await request(app)
      .get("/customers")
      .set("Authorization", `Bearer ${token}`)
      .query({ name: "Test Customer Pty Ltd", address: "456 Customer St" });
    expect(response.status).toBe(200);
    expect(response.body.abn).toBe("51824753556");
    expect(response.body.name).toBe("Test Customer Pty Ltd");
    expect(response.body.address).toBe("456 Customer St");
  });

  it("should return a 401 status if no authentication token is provided", async () => {
    const response = await request(app)
      .get("/customers")
      .query({ abn: "51824753556" });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized: No token provided");
  });
});
