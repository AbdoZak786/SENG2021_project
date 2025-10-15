import request from "supertest";
import app from "../app";
import pool from "../db";

describe("POST /users/register", () => {
  beforeAll(async () => {
    const user = await pool.query("SELECT * FROM USERS WHERE email = $1", ["email5@gmail.com"])
    if (user.rows.length > 0 && user.rows[0].id) {
      const userId = user.rows[0].id
      await pool.query("DELETE FROM USERS WHERE id = $1", [userId])
    }
  })

  it("should return a 201 status and a token on successful login", async () => {
    const response = await request(app).post("/users/register").send({ email: "email5@gmail.com", password: "password" });

    expect(response.status).toBe(201)
    expect(response.body.token).toBeDefined();
  })

  it("should return a 400 status with an error message for missing both fields", async () => {
    const response = await request(app).post("/users/register").send({})
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 400 status with an error message for missing password field", async () => {
    const response = await request(app).post("/users/register").send({ email: "test@gmail.com" })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })
  it("should return a 400 status with an error message for missing email field", async () => {
    const response = await request(app).post("/users/register").send({ password: "password" })
    expect(response.status).toBe(400)
    expect(response.body.error).toBeDefined()
  })

  it("should return a 409 status with an error message for user already existing", async () => {
    const response = await request(app).post("/users/register").send({ email: "email5@gmail.com", password: "password" })
    expect(response.status).toBe(409)
    expect(response.body.error).toBeDefined()
  })
})

describe("POST /users/login ", () => {
  beforeAll(async () => {
    const user = await pool.query("SELECT * FROM USERS WHERE email = $1", ["email6@gmail.com"])
    if (user.rows.length > 0 && user.rows[0].id) {
      const userId = user.rows[0].id
      await pool.query("DELETE FROM USERS WHERE id = $1", [userId])
    }
    await request(app).post("/users/register").send({ email: "email6@gmail.com", password: "password" })
  })
  it("should return a 400 status and an error message due to missing email", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ password: "wrongpassword" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("should return a 400 status and an error message due to missing password", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ email: "email6@gmail.com" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("should return a 400 status and an error message due to missing fields", async () => {
    const response = await request(app).post("/users/login").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
  it("should return a 401 status and an error message", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ email: "email6@gmail.com", password: "wrongpassword" });
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it("should return a 200 status and a user token", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ email: "email6@gmail.com", password: "password" });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
