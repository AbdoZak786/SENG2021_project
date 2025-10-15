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

describe("DELETE /sellers/delete/:abn", () => {
  const mockUserId = "123";
  const mockAbn = "987654321";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a 200 status and delete the seller", async () => {
    // Mock the SELECT query
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ abn: mockAbn, user_id: mockUserId }] }) // Mock SELECT
      .mockResolvedValueOnce({}); // Mock DELETE query (no result)

    const response = await request(app)
      .delete(`/sellers/delete/${mockAbn}`)
      .set("Authorization", "Bearer mockToken"); // Fake token

    // Assert the response
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Seller deleted successfully");

    // Assert the DELETE query was called with correct parameters
    expect(pool.query).toHaveBeenCalledWith(
      "DELETE FROM SELLERS WHERE abn = $1 AND user_id = $2",
      [mockAbn, mockUserId]
    );

    // Verify that the SELECT query was called to check if the seller exists
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM SELLERS WHERE abn = $1 AND user_id = $2",
      [mockAbn, mockUserId]
    );
  });
  
  it("should return a 404 error if the seller is not found", async () => {
    // Mock the SELECT query to simulate that the seller doesn't exist
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // No rows returned, seller not found
      .mockResolvedValueOnce({}); // Mock DELETE query (not called because of 404)

    const response = await request(app)
      .delete(`/sellers/delete/${mockAbn}`)
      .set("Authorization", "Bearer mockToken"); // Fake token

    // Assert the response status and message
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Seller not found");

    // Assert that the DELETE query was not called since the seller doesn't exist
    expect(pool.query).not.toHaveBeenCalledWith(
      "DELETE FROM SELLERS WHERE abn = $1 AND user_id = $2",
      [mockAbn, mockUserId]
    );

    // Verify that the SELECT query was called to check if the seller exists
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM SELLERS WHERE abn = $1 AND user_id = $2",
      [mockAbn, mockUserId]
    );
  });

});