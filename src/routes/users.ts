import { Router } from "express";
import { deleteUser, loginUsers, registerUsers } from "../controllers/usersController";
import { validateToken } from "../middleware/auth";

const router = Router();

router.post("/register", registerUsers);
router.post("/login", loginUsers);
router.delete("/delete", validateToken, deleteUser);

export default router;
