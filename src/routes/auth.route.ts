import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router=Router();

router.post("/register",authController.register);

router.post("/login",authController.login);

router.post("/firebase", authController.firebaseLogin);

router.get("/profile",authMiddleware, authController.profile);

export default router;

