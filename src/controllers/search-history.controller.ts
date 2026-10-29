
import type { Request, Response } from "express";

import { searchHistoryService } from "../services/search-history.service";
import { AppError } from "../utils/app-error";

import {
  saveLocationSchema,
  renameSavedLocationSchema,
  savedLocationIdSchema,
} from "../validators/search-history.validation";

export class SearchHistoryController {
  async saveLocation(req: Request, res: Response) {
    const userId = req.user!.userId;

    const validation = saveLocationSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError("Validation failed!", 400);
    }

    const location = await searchHistoryService.saveLocation(
      userId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Location saved successfully!",
      data: location,
    });
  }

  async getSavedLocations(req: Request, res: Response) {
    const userId = req.user!.userId;

    const locations =
      await searchHistoryService.getSavedLocations(userId);

    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  }

  async renameSavedLocation(req: Request, res: Response) {
    const userId = req.user!.userId;

    const idValidation = savedLocationIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      throw new AppError("Invalid parameters!", 400);
    }

    const bodyValidation =
      renameSavedLocationSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      throw new AppError("Validation failed!", 400);
    }

    const location =
      await searchHistoryService.renameSavedLocation(
        userId,
        idValidation.data.id,
        bodyValidation.data,
      );

    return res.status(200).json({
      success: true,
      message: "Saved location updated successfully!",
      data: location,
    });
  }

  async deleteSavedLocation(req: Request, res: Response) {
    const userId = req.user!.userId;

    const validation = savedLocationIdSchema.safeParse(req.params);

    if (!validation.success) {
      throw new AppError("Invalid parameters!", 400);
    }

    await searchHistoryService.deleteSavedLocation(
      userId,
      validation.data.id,
    );

    return res.status(200).json({
      success: true,
      message: "Saved location deleted successfully!",
    });
  }
}

export const searchHistoryController =
  new SearchHistoryController();
