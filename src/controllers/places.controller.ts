
import type { Request, Response } from "express";
import { placesService } from "../services/places.service";
import { AppError } from "../utils/app-error";

export class PlacesController {
  async nearby(req: Request, res: Response) {
    const parseQueryNumber = (
      value: unknown,
    ): number | undefined => {
      if (typeof value !== "string" || !value.trim()) {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const lat = parseQueryNumber(req.query.lat);
    const lng = parseQueryNumber(req.query.lng);

    const radiusValue = req.query.radius;
    const radius =
      radiusValue === undefined
        ? Number(process.env.DEFAULT_RADIUS || 5000)
        : parseQueryNumber(radiusValue);

    if (lat === undefined || lat < -90 || lat > 90) {
      throw new AppError("Invalid Latitude!", 400);
    }

    if (lng === undefined || lng < -180 || lng > 180) {
      throw new AppError("Invalid Longitude!", 400);
    }

    if (
      radius === undefined ||
      !Number.isFinite(radius) ||
      radius < 100 ||
      radius > 50000
    ) {
      throw new AppError(
        "Radius must be between 100 and 50000 meters!",
        400,
      );
    }

    const places = await placesService.searchNearbyLiquorStores(
      lat,
      lng,
      radius,
    );

    return res.status(200).json({
      success: true,
      message: `Found ${places.length} liquor shop(s) nearby`,
      data: {
        searchLocation: { lat, lng },
        radius,
        totalResults: places.length,
        places,
      },
    });
  }
}

export const placesController = new PlacesController();
