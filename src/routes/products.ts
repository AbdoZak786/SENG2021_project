import { Router } from "express";
import { createProducts, getProducts , editProduct , getProductsByInvoice,  deleteProduct, } from "../controllers/productsController";

const router = Router();

router.get("/", getProducts);
router.post("/create", createProducts);
router.patch("/edit/:invoice_id/:product_id", editProduct);
router.delete("/delete/:invoice_id/:product_id", deleteProduct);
router.get("/:invoice_id", getProductsByInvoice);

export default router;
