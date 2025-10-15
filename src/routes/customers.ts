import { Router } from "express";
import {
  createCustomer,
  getCustomer,
  editCustomer,
  deleteCustomer, } from "../controllers/customersController";

const router = Router();

router.get("/", getCustomer);
router.post("/create", createCustomer);
router.patch("/edit/:customer_id", editCustomer);
router.delete("/delete/:customer_id", deleteCustomer);
export default router;
