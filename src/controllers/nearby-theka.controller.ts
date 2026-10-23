import type { Request, Response } from "express";

import { nearbyThekaService } from "../services/nearby-theka.service";
import { AppError } from "../utils/app-error";

class NearbyThekaController {
  async getCombinedNearby(req: Request, res: Response) {
    const { lat: rawLat, lng: rawLng } = req.query;

    // Reject missing, empty, or repeated query parameters.
    if (
      typeof rawLat !== "string" ||
      !rawLat.trim() ||
      typeof rawLng !== "string" ||
      !rawLng.trim()
    ) {
      throw new AppError(
        "lat and lng are required query parameters.",
        400,
      );
    }

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      throw new AppError("Invalid latitude or longitude.", 400);
    }

    const rawRadius = req.query.radius;
    const rawLimit = req.query.limit;

    if (
      rawRadius !== undefined &&
      (typeof rawRadius !== "string" || !rawRadius.trim())
    ) {
      throw new AppError(
        "radius must be an integer between 1 and 50000 metres.",
        400,
      );
    }

    if (
      rawLimit !== undefined &&
      (typeof rawLimit !== "string" || !rawLimit.trim())
    ) {
      throw new AppError(
        "limit must be an integer between 1 and 100.",
        400,
      );
    }

    const radius = rawRadius === undefined ? 5000 : Number(rawRadius);
    const limit = rawLimit === undefined ? 20 : Number(rawLimit);

    if (
      !Number.isSafeInteger(radius) ||
      radius < 1 ||
      radius > 50000
    ) {
      throw new AppError(
        "radius must be an integer between 1 and 50000 metres.",
        400,
      );
    }

    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AppError(
        "limit must be an integer between 1 and 100.",
        400,
      );
    }

    const data = await nearbyThekaService.getCombinedNearbyThekas(
      lat,
      lng,
      radius,
      limit,
    );

    const hasResults =
      data.custom.length > 0 || data.google.length > 0;

    return res.status(200).json({
      success: true,
      count: data.totalResults,
      data,
      ...(data.sourceErrors ? { warnings: data.sourceErrors } : {}),
      ...(hasResults
        ? {}
        : { message: "No nearby liquor stores were found." }),
    });
  }
}

export const nearbyThekaController = new NearbyThekaController();