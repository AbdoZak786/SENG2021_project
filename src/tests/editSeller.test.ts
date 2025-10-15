import request from "supertest"
import app from "../app"
import pool from "../db";

describe("PATCH /seller/:{seller_id}", () => {
  let token: string
  let seller: { id: number, name: string, address: string, abn: number };
  beforeAll(async () => {
    await request(app).post("/users/register").send({ email: "abc1@def.ghi", password: "password" })
    const user = await request(app).post("/users/login").send({ email: "abc1@def.ghi", password: "password" })
    token = user.body.token
    seller = (await request(app).post("/sellers/create")
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "name", address: "address", abn: 51824753556 })).body
  })
  afterAll(async () => {
    await pool.query("DELETE FROM SELLERS WHERE id = $1", [seller.id]);
  })

  it("should return a 200 status and an updated version of the seller", async () => {
    const response = await request(app)
      .patch(`/sellers/edit/${seller.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...seller, name: "newName" })
    expect(response.status).toBe(200)
    expect(response.body.name).toBe("newName")
    expect(Number(response.body.abn)).toBe(seller.abn)
    expect(response.body.address).toBe(seller.address)
  })

  it("should return a 404 status ", async () => {
    const response = await request(app)
      .patch(`/sellers/edit/`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...seller, name: "newName" })
    expect(response.status).toBe(404)
  })

  it("should return a 404 status and an error seller not found", async () => {
    const response = await request(app)
      .patch(`/sellers/edit/9999999`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...seller, name: "newName" })
    expect(response.status).toBe(404)
    expect(response.body.error).toBeDefined()
  })
})