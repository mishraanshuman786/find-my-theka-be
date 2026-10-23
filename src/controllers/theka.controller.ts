
import type { Request, Response } from "express";
import { thekaService } from "../services/theka.service";
import { createThekaSchema } from "../validators/theka.validation";
import { AppError } from "../utils/app-error";

export class ThekaController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    const requestKey = req.get("Idempotency-Key")?.trim();

    if (
      !requestKey ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestKey,
      )
    ) {
      throw new AppError(
        "A valid Idempotency-Key UUID header is required.",
        400,
      );
    }

    const validationResult = createThekaSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Theka Registration Data!",
        error: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await thekaService.createTheka(
      req.user.userId,
      validationResult.data,
      requestKey,
    );

    if (!result.success) {
      const status =
        result.code === "GST_VERIFICATION_REQUIRED" ? 422 : 503;

      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  }

  async getMyThekas(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    const thekas = await thekaService.getMyThekas(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      data: thekas,
    });
  }

  async getById(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    const thekaId = Number(req.params.id);

    if (!Number.isSafeInteger(thekaId) || thekaId <= 0) {
      throw new AppError("Invalid theka ID", 400);
    }

    const theka = await thekaService.getThekaById(
      thekaId,
      req.user.userId,
    );

    if (!theka) {
      throw new AppError("Theka not found", 404);
    }

    return res.status(200).json({
      success: true,
      data: theka,
    });
  }

  async getNearby(req: Request, res: Response) {
    const getNumber = (
      value: unknown,
    ): number | undefined => {
      if (typeof value !== "string" || !value.trim()) {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const latitude = getNumber(req.query.lat);
    const longitude = getNumber(req.query.lng);

    const radius =
      req.query.radius === undefined
        ? 5000
        : getNumber(req.query.radius);

    const limit =
      req.query.limit === undefined
        ? 20
        : getNumber(req.query.limit);

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new AppError(
        "Valid lat and lng query parameters are required.",
        400,
      );
    }

    if (
      radius === undefined ||
      !Number.isInteger(radius) ||
      radius < 1 ||
      radius > 50000
    ) {
      throw new AppError(
        "Radius must be between 1 and 50000 metres.",
        400,
      );
    }

    if (
      limit === undefined ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AppError(
        "Limit must be between 1 and 100.",
        400,
      );
    }

    const thekas = await thekaService.getNearbyThekas(
      latitude,
      longitude,
      radius,
      limit,
    );

    return res.status(200).json({
      success: true,
      count: thekas.length,
      data: thekas,
    });
  }
}

export const thekaController = new ThekaController();
