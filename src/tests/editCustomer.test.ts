import request from "supertest"
import app from "../app"
import pool from "../db";

describe("PATCH /customer/:{customer_id}", () => {
  let token: string
  let customer: { id: number, name: string, address: string, abn?: number };
  beforeAll(async () => {
    await request(app).post("/users/register").send({ email: "abc1@def.ghi", password: "password" })
    const user = await request(app).post("/users/login").send({ email: "abc1@def.ghi", password: "password" })
    token = user.body.token
    customer = (await request(app).post("/customers/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "name", address: "address", abn: 51824753556 })).body
  })
  afterAll(async () => {
    await pool.query("DELETE FROM CUSTOMERS WHERE id = $1", [customer.id]);
  })

  it("should return a 200 status and an updated version of the customer", async () => {
    const response = await request(app)
      .patch(`/customers/edit/${customer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...customer, name: "newName" })
    expect(response.status).toBe(200)
    expect(response.body.name).toBe("newName")
    expect(Number(response.body.abn)).toBe(customer.abn)
    expect(response.body.address).toBe(customer.address)
  })

  it("should return a 404 status ", async () => {
    const response = await request(app)
      .patch(`/customers/edit/`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...customer, name: "newName" })
    expect(response.status).toBe(404)
  })

  it("should return a 404 status and an error customer not found", async () => {
    const response = await request(app)
      .patch(`/customers/edit/9999999`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...customer, name: "newName" })
    expect(response.status).toBe(404)
    expect(response.body.error).toBeDefined()
  })
})