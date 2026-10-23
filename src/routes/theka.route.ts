import {Router} from "express";
import { thekaController } from "../controllers/theka.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { nearbyThekaController } from "../controllers/nearby-theka.controller";

const router=Router();

// Public endpoint: GET /api/v1/thekas/nearby
router.get("/nearby",thekaController.getNearby);

// New combined custom + Google Places API
router.get(
  "/nearby/combined",
  nearbyThekaController.getCombinedNearby.bind(nearbyThekaController)
);

router.post("/",authMiddleware,thekaController.create);
router.get("/", authMiddleware, thekaController.getMyThekas);
router.get("/:id",authMiddleware,thekaController.getById);

export default router;