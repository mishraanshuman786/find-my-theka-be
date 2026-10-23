
import { Router } from "express";
import {Request, Response} from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { adminController } from "../controllers/admin.controller";

const router = Router();

// Every endpoint in this router requires an authenticated ADMIN.
router.use(authMiddleware, authorizeRoles("ADMIN"));


router.get("/dashboard/stats", adminController.getStats);


router.get("/thekas", adminController.getThekas);
router.get("/thekas/:id", adminController.getThekaById);

router.patch("/thekas/:id/approve", adminController.approveTheka);
router.patch("/thekas/:id/reject", adminController.rejectTheka);

router.delete("/thekas/:id", adminController.deleteExpiredTheka);

router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);

export default router;
