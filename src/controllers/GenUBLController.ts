import { create } from "xmlbuilder2"; // XML Builder for creating UBL XML
import pool from "../db"; // PostgreSQL database connection
import { Response } from "express"; // Express response type
import { AuthenticatedRequest } from "../middleware/auth";

export const generateInvoiceUBL = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoice_id } = req.params;
    const userId = req.user?.userId;
    const invoiceQuery = await pool.query("SELECT * FROM INVOICES WHERE id = $1", [invoice_id]);

    if (invoiceQuery.rows.length === 0) {
      res.status(400).json({ error: "Invalid invoice ID" });
      return;
    }

    const invoice = invoiceQuery.rows[0];
    const date = new Date()
    let issueDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // Default value if missing
    if (invoice.issue_date) {
      const parsedDate = new Date(invoice.issue_date);
      if (!isNaN(parsedDate.getTime())) {
        issueDate = parsedDate.toISOString().split("T")[0]; // Extract only YYYY-MM-DD
      }
    }
    const sellerQuery = await pool.query("SELECT * FROM SELLERS WHERE id = $1", [invoice.seller_id]);
    if (sellerQuery.rows.length === 0) {
      res.status(400).json({ error: "Seller not found" });
      return;
    }
    const seller = sellerQuery.rows[0];
    const customerQuery = await pool.query("SELECT * FROM CUSTOMERS WHERE id = $1", [invoice.customer_id]);
    if (customerQuery.rows.length === 0) {
      res.status(400).json({ error: "Customer not found" });
      return;
    }
    const customer = customerQuery.rows[0];
    const products = (await pool.query("SELECT * FROM PRODUCTS WHERE invoice_id = $1", [invoice.id])).rows
    const totalAmount = products.reduce((sum, p) => sum + p.rate * p.quantity, 0);
    const taxAmount = totalAmount * 0.1;
    // Build UBL XML using xmlbuilder2 (WITHOUT TIME)
    const xmlInvoice = create({ version: "1.0", encoding: "UTF-8" })
      .ele("Invoice", { xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" })
      .ele("cbc:ID").txt(invoice_id).up()
      .ele("cbc:IssueDate").txt(issueDate).up() // IssueDate now has only YYYY-MM-DD
      .ele("cbc:InvoiceTypeCode").txt("380").up() // Standard invoice code
      .ele("cac:AccountingSupplierParty")
      .ele("cac:Party")
      .ele("cbc:Name").txt(seller.name).up()
      .ele("cbc:CompanyID").txt(seller.abn).up()
      .ele("cac:PostalAddress")
      .ele("cbc:StreetName").txt(seller.address).up()
      .up()
      .up()
      .up()
      .ele("cac:AccountingCustomerParty")
      .ele("cac:Party")
      .ele("cbc:Name").txt(customer.name).up()
      .ele("cbc:CompanyID").txt(customer.abn).up()
      .ele("cac:PostalAddress")
      .ele("cbc:StreetName").txt(customer.address).up()
      .up()
      .up()
      .up()
      .ele("cac:TaxTotal")
      .ele("cbc:TaxAmount", { currencyID: "AUD" }).txt(taxAmount.toFixed(2)).up()
      .up()
      .ele("cac:LegalMonetaryTotal")
      .ele("cbc:PayableAmount", { currencyID: "AUD" }).txt(totalAmount).up()
      .up();
    products.forEach((product) => {
      xmlInvoice
        .ele("cac:InvoiceLine")
        .ele("cbc:ID").txt(product.id).up()
        .ele("cbc:InvoicedQuantity").txt(product.quantity).up()
        .ele("cbc:LineExtensionAmount", { currencyID: "AUD" }).txt((product.rate * product.quantity).toFixed(2)).up()
        .ele("cac:Item")
        .ele("cbc:Description").txt(product.description).up()
        .up()
        .ele("cac:Price")
        .ele("cbc:PriceAmount", { currencyID: "AUD" }).txt(product.rate).up()
        .up()
        .up();
    });

    const invoiceUBLString = xmlInvoice.end({ prettyPrint: true });

    res.status(200).json({ invoiceUBLString });
  } catch (e) {
    console.error("Error generating UBL invoice:", e);
    res.status(500).json({ error: "An error occurred while generating the invoice" });
  }
};
