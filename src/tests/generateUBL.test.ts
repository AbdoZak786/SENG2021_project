import request from "supertest"
import app from "../app"
import pool from "../db";
jest.setTimeout(20000)

describe("GET /invoices/:{invoice_id}/generate", () => {
  let token: string
  let customer: { id: number, name: string, address: string, abn?: number };
  let seller: { id: number, name: string, address: string, abn: number };
  let invoice: {
    invoice_id: number,
    sellerDetails:
    {
      id: number,
      name: string,
      address: string,
      abn: number
    },
    customerDetails: {
      id: number,
      name: string,
      address: string,
      abn: number
    }
  }
  beforeAll(async () => {
    await request(app).post("/users/register").send({ email: "abc@def.ghi", password: "password" })
    const user = await request(app).post("/users/login").send({ email: "abc@def.ghi", password: "password" })
    token = user.body.token
    seller = (await request(app).post("/sellers/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "name", address: "address", abn: 51824753556 })).body
    customer = (await request(app).post("/customers/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "name", address: "address", abn: 51824753556 })).body
    invoice = (await request(app).post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ seller, customer })).body
    const a = await request(app).post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoice.invoice_id, description: "KEYBOARD", rate: 135, quantity: 2 })
    const b = await request(app).post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoice.invoice_id, description: "MOUSE", rate: 160, quantity: 1 })
    const c = await request(app).post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoice.invoice_id, description: "MONITOR", rate: 400, quantity: 3 })
  })

  afterAll(async () => {
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
  })
  it("should return 200 code and create a ubl invoice", async () => {
    const response = await request(app).get(`/invoices/${invoice.invoice_id}/generate`)
      .set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(200)
    expect(response.body.invoiceUBLString).toBeDefined()
  })

  it("should return 400 code and an error message due to invalid invoice_id", async () => {
    const response = await request(app).get(`/invoices/99999/generate`)
      .set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined()
  })
})