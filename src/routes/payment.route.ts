import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { paymentController } from "../controllers/payment.controller";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/verify",
  authMiddleware,
  paymentController.verifyCheckoutPayment,
);

export default router;