
import { Request, Response } from "express";
import { nearbyThekaService } from "../services/nearby-theka.service";

class NearbyThekaController {
  async getCombinedNearby(req: Request, res: Response): Promise<Response> {
    try {
      const { lat: rawLat, lng: rawLng } = req.query;

      // Reject empty or repeated query parameters.
      if (
        typeof rawLat !== "string" ||
        rawLat.trim() === "" ||
        typeof rawLng !== "string" ||
        rawLng.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "lat and lng are required query parameters.",
        });
      }

      const lat = Number(rawLat);
      const lng = Number(rawLng);

      const rawRadius = req.query.radius;
      const rawLimit = req.query.limit;

      const radius =
        rawRadius === undefined ? 5000 : Number(rawRadius);

      const limit =
        rawLimit === undefined ? 20 : Number(rawLimit);

      if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90 ||
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude.",
        });
      }

      if (
        (rawRadius !== undefined &&
          (typeof rawRadius !== "string" || rawRadius.trim() === "")) ||
        !Number.isInteger(radius) ||
        radius < 1 ||
        radius > 50000
      ) {
        return res.status(400).json({
          success: false,
          message: "radius must be an integer between 1 and 50000 metres.",
        });
      }

      if (
        (rawLimit !== undefined &&
          (typeof rawLimit !== "string" || rawLimit.trim() === "")) ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "limit must be an integer between 1 and 100.",
        });
      }

      const data = await nearbyThekaService.getCombinedNearbyThekas(
        lat,
        lng,
        radius,
        limit
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
    } catch (error) {
      console.error("Combined nearby thekas error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch nearby liquor stores.",
      });
    }
  }
}

export const nearbyThekaController = new NearbyThekaController();
