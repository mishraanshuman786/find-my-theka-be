
import { Request, Response } from "express";
import { thekaService } from "../services/theka.service";
import { createThekaSchema } from "../validators/theka.validation";

const THEKA_ERRORS: Record<
  string,
  { status: number; message: string }
> = {
  INVALID_GSTIN_FORMAT: {
    status: 400,
    message: "The GSTIN format is invalid.",
  },
  GST_CREDITS_INSUFFICIENT: {
    status: 503,
    message: "GST verification credits are exhausted.",
  },
  GST_PROVIDER_NOT_CONFIGURED: {
    status: 500,
    message: "GST verification is not configured.",
  },
  GST_PROVIDER_CONFIGURATION_INVALID: {
    status: 500,
    message: "GST verification configuration is invalid.",
  },
  GST_BALANCE_UNAVAILABLE: {
    status: 502,
    message: "Unable to check GST verification credits.",
  },
  GST_PROVIDER_AUTH_FAILED: {
    status: 502,
    message: "GST provider rejected the API credentials.",
  },
  GST_PROVIDER_RATE_LIMITED: {
    status: 503,
    message: "GST provider rate limit reached.",
  },
  GST_PROVIDER_UNAVAILABLE: {
    status: 502,
    message: "GST provider is temporarily unavailable.",
  },
  GST_PROVIDER_REQUEST_FAILED: {
    status: 502,
    message: "GST verification request failed.",
  },
  GST_PROVIDER_INVALID_RESPONSE: {
    status: 502,
    message: "GST provider returned an unexpected response.",
  },
  GST_PROVIDER_GSTIN_MISMATCH: {
    status: 502,
    message: "GST provider returned a mismatched GSTIN.",
  },
  THEKA_REGISTRATION_FEE_NOT_CONFIGURED: {
    status: 500,
    message: "The theka registration fee is not configured.",
  },
};

export class ThekaController {
  
async create(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized!",
    });
  }

  const requestKey = req.get("Idempotency-Key")?.trim();

  if (
    !requestKey ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)
  ) {
    return res.status(400).json({
      success: false,
      code: "INVALID_IDEMPOTENCY_KEY",
      message: "A valid Idempotency-Key UUID header is required.",
    });
  }

  const validationResult = createThekaSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid Theka Registration Data!",
      error: validationResult.error.flatten().fieldErrors,
    });
  }

  try {
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
  } catch (error) {
    const code = error instanceof Error ? error.message : "";

    if (code === "IDEMPOTENCY_KEY_REUSED") {
      return res.status(409).json({
        success: false,
        code,
        message:
          "This registration key was already used with different data. Start a new registration attempt.",
      });
    }

    if (code === "THEKA_REGISTRATION_FEE_NOT_CONFIGURED") {
      return res.status(500).json({
        success: false,
        code,
        message: "The registration fee is not configured.",
      });
    }

    console.error("Theka Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete theka registration.",
    });
  }
}


  async getMyThekas(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!",
        });
      }

      const thekas = await thekaService.getMyThekas(
        req.user.userId,
      );

      return res.status(200).json({
        success: true,
        data: thekas,
      });
    } catch (error) {
      console.error("Get Thekas Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!",
        });
      }

      const thekaId = Number(req.params.id);

      if (!Number.isSafeInteger(thekaId) || thekaId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid theka ID",
        });
      }

      const theka = await thekaService.getThekaById(
        thekaId,
        req.user.userId,
      );

      if (!theka) {
        return res.status(404).json({
          success: false,
          message: "Theka not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: theka,
      });
    } catch (error) {
      console.error("Get Theka Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  }

  // get nearby thekas
  
async getNearby(req: Request, res: Response) {
  const getNumber = (
    value: unknown,
  ): number | undefined => {
    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const latitude = getNumber(req.query.lat);
  const longitude = getNumber(req.query.lng);
  const radius = getNumber(req.query.radius) ?? 5000;
  const limit = getNumber(req.query.limit) ?? 20;

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Valid lat and lng query parameters are required.",
    });
  }

  if (
    !Number.isInteger(radius) ||
    radius < 1 ||
    radius > 50000
  ) {
    return res.status(400).json({
      success: false,
      message: "Radius must be between 1 and 50000 metres.",
    });
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 100.",
    });
  }

  try {
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
  } catch (error) {
    req.log?.error(
      { err: error },
      "Failed to fetch nearby verified thekas",
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch nearby thekas.",
    });
  }
}

}

export const thekaController = new ThekaController();
