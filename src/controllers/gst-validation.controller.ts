import type { Request, Response } from "express";

import { gstVerificationService } from "../services/gst-verification.service";
import { verifyGstinSchema } from "../validators/verify-gstin.validation";
import { AppError } from "../utils/app-error";

export const gstValidationController = {
  verify: async (req: Request, res: Response) => {
    const parsed = verifyGstinSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid GSTIN format", 422);
    }

    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Authentication required!", 401);
    }

    const result = await gstVerificationService.verifyGstin(
      String(userId),
      parsed.data.gstin,
    );

    // A completed verification can legitimately return an invalid/inactive GSTIN.
    if (!result.valid) {
      throw new AppError(
        result.message || "GSTIN verification failed!",
        422,
      );
    }

    return res.status(200).json({
      success: true,
      message: "GSTIN verified successfully",
      data: result,
    });
  },
};