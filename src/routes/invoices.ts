import { Router } from "express";
import {
  createInvoices,
  getInvoices,
  editInvoice, deleteInvoice,
} from "../controllers/invoicesController";
import { generateInvoiceUBL } from "../controllers/GenUBLController";

const router = Router();

router.get("/", getInvoices);
router.post("/create", createInvoices);
router.patch("/edit/:invoice_id", editInvoice);
router.delete("/delete/:invoice_id", deleteInvoice);
router.get("/:invoice_id/generate", generateInvoiceUBL);
export default router;
