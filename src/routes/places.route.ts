import { Router } from "express";
import { placesController } from "../controllers/places.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { searchHistoryController } from "../controllers/search-history.controller";

const router=Router();

router.get("/nearby",placesController.nearby);

//  history related routes
router.post("/saved-locations", authMiddleware, searchHistoryController.saveLocation);

router.get("/saved-locations", authMiddleware, searchHistoryController.getSavedLocations);

router.patch("/saved-locations/:id", authMiddleware, searchHistoryController.renameSavedLocation);

router.delete("/saved-locations/:id", authMiddleware, searchHistoryController.deleteSavedLocation);

export default router;

