import { Router } from "express";
import { placesController } from "../controllers/places.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router=Router();

router.get("/nearby",placesController.nearby);

export default router;

