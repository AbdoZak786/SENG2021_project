import { Router } from "express";
import {
  createSeller,
  getSeller,
  editSeller, deleteSeller,
} from "../controllers/sellersController";

const router = Router();

router.get("/", getSeller);
router.post("/create", createSeller);
router.patch("/edit/:id", editSeller); // Add this line for editing seller
router.delete("/delete/:abn", deleteSeller);
export default router;
