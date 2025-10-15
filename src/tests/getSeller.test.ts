import request from "supertest";
import app from "../app";
import { registerUser, loginUser, createSeller } from "../tests/getTestUtils";
import pool from "../db";

describe("GET /sellers", () => {
  let token: string;
  let seller: { id: number, name: string, address: string, abn?: number };

  beforeAll(async () => {
    await registerUser("seller@example.com", "password");
    token = await loginUser("seller@example.com", "password");

    seller = await createSeller(token, "Test Seller Pty Ltd", "123 Seller St", 51824753556);
  });

  afterAll(async () => {
    if (seller.id) {
      await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
    }
  });

  it("should return a 400 status due to missing parameters", async () => {
    const response = await request(app)
      .get("/sellers")
      .set("Authorization", `Bearer ${token}`)
      .query({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("should return a 404 status if seller does not exist", async () => {
    const response = await request(app)
      .get("/sellers")
      .set("Authorization", `Bearer ${token}`)
      .query({ abn: "10000000000" });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Seller not found");
  });

  it("should return a 200 status and the seller details using ABN", async () => {
    const response = await request(app)
      .get("/sellers")
      .set("Authorization", `Bearer ${token}`)
      .query({ abn: "51824753556" });
    expect(response.status).toBe(200);
    expect(response.body.abn).toBe("51824753556");
    expect(response.body.name).toBe("Test Seller Pty Ltd");
    expect(response.body.address).toBe("123 Seller St");
  });

  it("should return a 200 status and the seller details using company name", async () => {
    const response = await request(app)
      .get("/sellers")
      .set("Authorization", `Bearer ${token}`)
      .query({ name: "Test Seller Pty Ltd" });
    expect(response.status).toBe(200);
    expect(response.body.abn).toBe("51824753556");
    expect(response.body.name).toBe("Test Seller Pty Ltd");
    expect(response.body.address).toBe("123 Seller St");
  });

  it("should return a 401 status if no authentication token is provided", async () => {
    const response = await request(app)
      .get("/sellers")
      .query({ abn: "51824753556" });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized: No token provided");
  });
});
