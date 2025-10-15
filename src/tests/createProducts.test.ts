import request from "supertest"
import app from "../app"
import pool from "../db"

describe("POST /products/create", () => {
  let token: string
  let customer: { id: number, name: string, address: string, abn?: number }
  let seller: { id: number, name: string, address: string, abn: number }
  let invoiceId: number
  beforeAll(async () => {
    await request(app)
      .post("/users/register")
      .send({ email: "email2@gmail.com", password: "password" });
    const user = await request(app)
      .post("/users/login")
      .send({ email: "email2@gmail.com", password: "password" });
    token = user.body.token;
    seller = (await request(app)
      .post("/sellers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "seller1", address: "UNSW", abn: 51824753556 })).body;
    customer = (await request(app)
      .post("/customers/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "customer1", address: "UNSW", abn: 51824753556 })).body;
    const invoiceQuery = await request(app).post("/invoices/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ seller, customer })
    invoiceId = (invoiceQuery).body.invoice_id
  })

  afterAll(async () => {
    await pool.query("DELETE FROM INVOICES WHERE id = $1", [invoiceId])
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
  })
  it("should return a 201 status and a products object", async () => {
    const response = await request(app)
      .post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoiceId, description: "PVC PIPE", rate: 15, quantity: 3 })
    expect(response.status).toBe(201)
    expect(response.body.product_id).toBeDefined()
    expect(response.body.invoice_id).toBeDefined()
    expect(response.body.description).toBeDefined()
    expect(response.body.rate).toBeDefined()
    expect(response.body.quantity).toBeDefined()
  })

  it("should return a 400 status and an error message due to missing invoice_id", async () => {
    const response = await request(app)
      .post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ description: "PVC PIPE", rate: 15, quantity: 3 })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to missing description", async () => {
    const response = await request(app)
      .post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoiceId, rate: 15, quantity: 3 })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to missing rate", async () => {
    const response = await request(app)
      .post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoiceId, description: "PVC PIPE", quantity: 3 })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to missing quantity", async () => {
    const response = await request(app)
      .post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoiceId, description: "PVC PIPE", rate: 15 })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status and an error message due to invalid invoice_id", async () => {
    const response = await request(app)
      .post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: 99999, description: "PVC PIPE", rate: 15, quantity: 3 })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
})