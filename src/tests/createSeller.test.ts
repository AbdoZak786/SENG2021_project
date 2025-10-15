import request from "supertest";
import app from "../app";
import pool from "../db";

describe("POST /sellers/create ", () => {
  let token: string;
  beforeAll(async () => {
    await request(app)
      .post("/users/register")
      .send({ email: "email3@gmail.com", password: "password" });
    const response = await request(app)
      .post("/users/login")
      .send({ email: "email3@gmail.com", password: "password" });
    token = response.body.token;
  });

  beforeEach(async () => {
    const sellers = await pool.query("SELECT * FROM SELLERS WHERE name = $1 AND address = $2 AND abn = $3", ["seller", "UNSW", 51824753556])
    if (sellers.rows.length > 0) {
      sellers.rows.map(async seller => await pool.query("DELETE FROM sellerS WHERE id = $1", [seller.id]))
    }
  })

  it("should return a 201 status and a sellers object", async () => {
    const response = await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", address: "UNSW", abn: 51824753556 });
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  it("should return a 400 status and a missing field error due to name", async () => {
    const response = await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "UNSW", abn: 51824753556 });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and a missing field error due to address", async () => {
    const response = await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", abn: 51824753556 });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and a missing field error due to abn", async () => {
    const response = await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", address: "UNSW" });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })


  it("should return a 400 status and a missing field error due to invalid abn", async () => {
    const response = await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", address: "UNSW", abn: 12345678901 });
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
  it("should return a 409 status and an error due to existing user", async () => {
    await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", address: "UNSW", abn: 51824753556 });
    const response = await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", address: "UNSW", abn: 51824753556 });
    expect(response.status).toBe(409)
    expect(response.body.error).toBeDefined()
  })
});
