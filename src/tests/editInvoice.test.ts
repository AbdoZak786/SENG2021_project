import request from "supertest"
import app from "../app"
import pool from "../db";

describe("PATCH /invoices/edit/:id", () => {
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
    };
  }
  beforeAll(async () => {
    await request(app).post("/users/register").send({ email: "abc1@def.ghi", password: "password" })
    const user = await request(app).post("/users/login").send({ email: "abc1@def.ghi", password: "password" })
    token = user.body.token
    customer = seller = (await request(app).post("/customers/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "name", address: "address", abn: 51824753556 })).body
    seller = (await request(app).post("/sellers/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "name", address: "address", abn: 51824753556 })).body
    invoice = (await request(app).post("/invoices/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ seller, customer })).body
  })
  afterAll(async () => {
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
  })

  it("should return 200 code and invoice object", async () => {
    const invoice_id = invoice.invoice_id
    const response = await request(app)
      .patch(`/invoices/edit/${invoice_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        seller: { ...seller, name: "newName" },
        customer: { ...customer, name: "coolName" }
      })
    expect(response.status).toBe(200)
    expect(response.body.invoice_id).toBeDefined()
    expect(response.body.sellerDetails).toBeDefined()
    expect(response.body.sellerDetails.id).toBe(seller.id)
    expect(response.body.sellerDetails.abn).toBe(seller.abn)
    expect(response.body.sellerDetails.address).toBe(seller.address)
    expect(response.body.sellerDetails.name).toBe("newName")
    expect(response.body.customerDetails).toBeDefined()
    expect(response.body.customerDetails.id).toBe(customer.id)
    expect(response.body.customerDetails.abn).toBe(customer.abn)
    expect(response.body.customerDetails.address).toBe(customer.address)
    expect(response.body.customerDetails.name).toBe("coolName")
  })

  it("should return 404 and error object due to no invoice_id", async () => {
    const response = await request(app)
      .patch(`/invoices/edit/`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        seller: { ...seller, name: "newName" },
        customer: { ...customer, name: "coolName" }
      })
    expect(response.status).toBe(404)
  })
  it("should return 400 and error object due to invalid fields", async () => {
    const invoice_id = invoice.invoice_id
    const response = await request(app)
      .patch(`/invoices/edit/${invoice_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        seller: { ...seller, name: undefined },
        customer
      })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
  it("should return 404 and error object due to invalid fields", async () => {
    const invoice_id = invoice.invoice_id + 1000
    const response = await request(app)
      .patch(`/invoices/edit/${invoice_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        seller: { ...seller, name: "newName1" },
        customer
      })
    expect(response.status).toBe(404)
    expect(response.body.error).toBeDefined()
  })
})