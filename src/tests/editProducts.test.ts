import request from "supertest"
import app from "../app";
import pool from "../db";
jest.setTimeout(20000)

describe("PATCH /products/edit/:{invoice_id}/:{product_id}", () => {
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
  let product: {
    invoice_id: number,
    product_id: number,
    description: string,
    rate: number,
    quantity: number
  }
  beforeAll(async () => {
    await request(app).post("/users/register").send({ email: "abc3@def.ghi", password: "password" })
    const user = await request(app).post("/users/login").send({ email: "abc3@def.ghi", password: "password" })
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
    product = (await request(app).post("/products/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ invoice_id: invoice.invoice_id, description: "KEYBOARD", rate: 135, quantity: 2 })).body
  })
  afterAll(async () => {
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
  })

  it("should return 200 code", async () => {
    const invoice_id = invoice.invoice_id
    const product_id = product.product_id
    const response = await request(app)
      .patch(`/products/edit/${invoice_id}/${product_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...product, description: "TABLE" })
    expect(response.status).toBe(200)
    expect(response.body.product_id).toBe(String(product.product_id))
    expect(response.body.description).toBe("TABLE")
    expect(response.body.rate).toBe(product.rate)
    expect(response.body.quantity).toBe(product.quantity)
  })

  it("should return 200 code", async () => {
    const invoice_id = invoice.invoice_id
    const product_id = product.product_id
    const response = await request(app)
      .patch(`/products/edit/${invoice_id}/${product_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...product, description: "TABLE" })
    expect(response.status).toBe(200)
    expect(response.body.product_id).toBe(String(product.product_id))
    expect(response.body.description).toBe("TABLE")
    expect(response.body.rate).toBe(product.rate)
    expect(response.body.quantity).toBe(product.quantity)
  })

  it("should return 400 code as description undefined", async () => {
    const invoice_id = invoice.invoice_id
    const product_id = product.product_id
    const response = await request(app)
      .patch(`/products/edit/${invoice_id}/${product_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...product, description: undefined })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return 404 code as invalid product id", async () => {
    const invoice_id = invoice.invoice_id
    const response = await request(app)
      .patch(`/products/edit/${invoice_id}/0`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...product, product_id: 0 })
    expect(response.status).toBe(404)
    expect(response.body.error).toBeDefined()
  })
})