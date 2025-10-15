import request from "supertest"
import app from "../app";
import pool from "../db";

describe("POST /invoices/create", () => {
  let token: string
  let customer: any
  let seller: any
  beforeAll(async () => {
    await request(app)
      .post("/users/register")
      .send({ email: "email1@gmail.com", password: "password" });
    const response = await request(app)
      .post("/users/login")
      .send({ email: "email1@gmail.com", password: "password" });
    token = response.body.token;
    seller = (await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller", address: "UNSW", abn: 51824753556 })).body;
    customer = (await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer", address: "UNSW", abn: 51824753556 })).body;
  })

  afterAll(async () => {
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
  })

  it("should return a 201 status and an invoices object", async () => {
    const response = await request(app)
      .post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ seller, customer })
    expect(response.status).toBe(201)
    expect(response.body.invoice_id).toBeDefined()
    expect(response.body.sellerDetails).toBeDefined()
    expect(response.body.customerDetails).toBeDefined()
    await pool.query("DELETE FROM INVOICES WHERE id = $1", [response.body.invoice_id])
  })

  it("should return a 400 status and an error message due to missing customer", async () => {
    const response = await request(app)
      .post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ seller, })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to missing seller", async () => {
    const response = await request(app)
      .post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ customer })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to invalid seller", async () => {
    const invalidSeller = { ...seller, name: "customer" }
    const response = await request(app)
      .post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invalidSeller, customer })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to invalid Customer", async () => {
    const invalidCustomer = { ...customer, name: "seller" }
    const response = await request(app)
      .post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invalidCustomer, customer })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
})