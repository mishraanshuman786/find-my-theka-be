import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { gstRateLimiter } from "../middleware/rate-limit.middleware";
import { gstValidationController } from "../controllers/gst-validation.controller";

const router=Router();

router.post("/verify",authMiddleware, gstRateLimiter, gstValidationController.verify);

export default router;