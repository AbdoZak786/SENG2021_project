import request from "supertest";
import app from "../app";
import pool from "../db";
let token: string;

beforeAll(async () => {
  await request(app)
    .post("/users/register")
    .send({ email: "email@gmail.com", password: "password" });
  const response = await request(app)
    .post("/users/login")
    .send({ email: "email@gmail.com", password: "password" });
  token = response.body.token;

});
describe("POST /customers/create ", () => {
  beforeEach(async () => {
    const customers = await pool.query("SELECT * FROM CUSTOMERS WHERE name = $1 AND address = $2", ["customer", "UNSW"])
    if (customers.rows.length > 0) {
      customers.rows.map(async customer => await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]))
    }
  })
  it("should return a 201 status and a customers object with no abn input", async () => {
    const response = await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer", address: "UNSW" });
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  it("should return a 201 status and a customers object with an abn input", async () => {
    const response = await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer", address: "UNSW", abn: 51824753556 });
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  it("should return a 400 status and a missing field error due to name", async () => {
    const response = await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "UNSW" });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and a missing field error due to address", async () => {
    const response = await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer" });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and a missing field error due to invalid abn", async () => {
    const response = await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer", address: "UNSW", abn: 12345678901 });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
  it("should return a 409 status and an error due to existing user", async () => {
    await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer", address: "UNSW" });
    const response = await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer", address: "UNSW" });
    expect(response.status).toBe(409)
    expect(response.body.error).toBeDefined()
  })
});
