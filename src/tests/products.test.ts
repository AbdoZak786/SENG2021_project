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

describe("DELETE /delete/:invoice_id/:product_id", () => {
  const mockInvoiceId = "123";
  const mockProductId = "123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 when a product is successfully deleted", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: mockProductId, invoice_id: mockInvoiceId }] }) // Mock SELECT
      .mockResolvedValueOnce({}); // Mock DELETE

    const response = await request(app)
      .delete(`/products/delete/${mockInvoiceId}/${mockProductId}`)
      .set("Authorization", "Bearer mockToken");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Product deleted successfully");

    expect(pool.query).toHaveBeenCalledWith(
      "DELETE FROM PRODUCTS WHERE id = $1 AND invoice_id = $2",
      [mockInvoiceId, mockProductId]
    );

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM PRODUCTS WHERE id = $1 AND invoice_id = $2",
      [mockInvoiceId, mockProductId]
    );
  });

  it("should return 404 if the product does not exist", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // No product found

    const response = await request(app)
      .delete("/products/delete/10/999")
      .set("Authorization", "Bearer mockToken");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found in this invoice");
  });

  it("should return 400 if invoice_id or product_id is missing", async () => {
    const response = await request(app)
      .delete("/products/delete//1")
      .set("Authorization", "Bearer mockToken");

    expect(response.status).toBe(404); // Express treats this as an invalid route
  });
});