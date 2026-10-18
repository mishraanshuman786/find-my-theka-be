import { Request, Response } from "express";

import { gstVerificationService } from "../services/gst-verification.service";
import { verifyGstinSchema } from "../validators/verify-gstin.validation";

export const gstValidationController = {
  verify: async (req: Request, res: Response) => {
    const parsed = verifyGstinSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: "Invalid GSTIN format",
        errors: parsed.error.flatten(),
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication Required!",
      });
    }

    try {
      const result = await gstVerificationService.verifyGstin(
        String(userId),
        parsed.data.gstin,
      );

      if (!result.valid) {
        return res.status(422).json({
          success: false,
          message: result.message || "GSTIN Verification failed!",
          data: result,
        });
      }

      return res.status(200).json({
        success: true,
        message: "GSTIN Verified Successfully",
        data: result,
      });
    } catch (error) {
      console.error("GST Verification Error:", error);

      return res.status(502).json({
        success: false,
        message: "GST Verification service is unavailable. Please Retry!",
      });
    }
  },
};
