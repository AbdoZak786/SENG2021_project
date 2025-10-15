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

describe("DELETE /invoices/delete/:invoice_id", () => {
  const mockInvoiceId = "123";
  const mockSellerId = "123"; // You should have a mock seller ID that you expect the user to be associated with.

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a 200 status and delete the invoice", async () => {
    // Mock the SELECT query to return the invoice
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: mockInvoiceId, seller_id: mockSellerId }] }) // Mock SELECT
      .mockResolvedValueOnce({}); // Mock DELETE query (no result)

    const response = await request(app)
      .delete(`/invoices/delete/${mockInvoiceId}`)
      .set("Authorization", "Bearer mockToken"); // Fake token

    // Assert the response
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Invoice deleted successfully");

    // Assert the DELETE query was called with correct parameters
    expect(pool.query).toHaveBeenCalledWith(
      "DELETE FROM INVOICES WHERE id = $1 AND seller_id = $2",
      [mockInvoiceId, mockSellerId]
    );

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM INVOICES WHERE id = $1 AND seller_id = $2",
      [mockInvoiceId, mockSellerId]
    );
  });

  it("should return a 404 error if the invoice is not found", async () => {
    // Mock SELECT query to return no rows (invoice not found)
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }); // No invoice found
      // Do not mock the DELETE query, as it should not be called

    const response = await request(app)
      .delete(`/invoices/delete/${mockInvoiceId}`)
      .set("Authorization", "Bearer mockToken"); // Fake token

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Invoice not found");

    // Assert that the DELETE query was NOT called
    expect(pool.query).not.toHaveBeenCalledWith(
      "DELETE FROM INVOICES WHERE id = $1 AND seller_id = $2",
      [mockInvoiceId, mockSellerId]
    );

    // Ensure SELECT query was called to check if the invoice exists
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM INVOICES WHERE id = $1 AND seller_id = $2",
      [mockInvoiceId, mockSellerId]
    );
  });
});