import { Router } from "express";
import customerRoutes from "./customers";
import sellersRoutes from "./sellers";
import productsRoutes from "./products";
import invoicesRoutes from "./invoices";
import usersRoutes from "./users";
import { validateToken } from "../middleware/auth";

const router = Router();

router.use("/customers", validateToken, customerRoutes);
router.use("/products", validateToken, productsRoutes);
router.use("/invoices", validateToken, invoicesRoutes);
router.use("/sellers", validateToken, sellersRoutes);
router.use("/users", usersRoutes);

export default router;
