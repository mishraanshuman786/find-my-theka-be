import { Request, Response } from "express";

import {
  placesService,
} from "../services/places.service";

export class PlacesController {
 

  async nearby(req: Request, res: Response) {
    try {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);

      const radius = Number(
        req.query.radius || process.env.DEFAULT_RADIUS || 5000,
      );

      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message: "Invalid Latitude!",
        });
      }

      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid Longitude!",
        });
      }

      if (Number.isNaN(radius) || radius < 100 || radius > 50000) {
        return res.status(400).json({
          success: false,
          message: "Radius must be between 100 and 50000 meters!",
        });
      }

      const places =
        await placesService.searchNearbyLiquorStores(
          lat,
          lng,
          radius,
        );

      return res.status(200).json({
        success: true,
        message: `Found ${places.length} liquor shop(s) nearby`,
        data: {
          searchLocation: {
            lat,
            lng,
          },
          radius,
          totalResults: places.length,
          places,
        },
      });
    } catch (error: any) {
      console.error(
        "Nearby places controller error:",
        error.response?.data || error.message,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch nearby liquor shops!",
      });
    }
  }
}

export const placesController = new PlacesController();