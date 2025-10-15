import request from "supertest";
import app from "../app";
import pool from "../db";

jest.mock("../db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock("../middleware/auth", () => ({
    validateToken: (req: Request, _: Response, next: Function) => {
      (req as any).user = { userId: "123" }; // Mock authenticated user
      next();
    },
  }));

describe("DELETE /users/delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a 200 status when the user is successfully deleted", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ user_id: "123" }] }) // SELECT query
      .mockResolvedValueOnce({}); // DELETE query

    const response = await request(app)
      .delete("/users/delete")
      .set("Authorization", "Bearer mockToken"); // Ensure token is set

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");
  });

  it("should return a 404 if the user does not exist", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // No user found

    const response = await request(app)
      .delete("/users/delete")
      .set("Authorization", "Bearer mockToken");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
  });
});