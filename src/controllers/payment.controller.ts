import type { Request, Response } from "express";
import { verifyPaymentSchema } from "../validators/payment.validation";
import { paymentService } from "../services/payment.service";

export class PaymentController {
  async verifyCheckoutPayment(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = verifyPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await paymentService.verifyCheckoutPayment(
        req.user.userId,
        parsed.data,
      );

      return res.status(result.success ? 200 : 202).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";

      const errors: Record<string, { status: number; message: string }> = {
        PAYMENT_NOT_FOUND: {
          status: 404,
          message: "Payment not found",
        },
        PAYMENT_FORBIDDEN: {
          status: 403,
          message: "You cannot verify this payment",
        },
        INVALID_PAYMENT_SIGNATURE: {
          status: 400,
          message: "Invalid payment signature",
        },
        PAYMENT_DETAILS_MISMATCH: {
          status: 400,
          message: "Payment details do not match",
        },
        PAYMENT_ALREADY_COMPLETED: {
          status: 409,
          message: "Payment was completed using a different payment ID",
        },
        PAYMENT_NOT_PAYABLE: {
          status: 409,
          message: "Payment cannot be completed in its current state",
        },
        INVALID_THEKA_REFERENCE: {
          status: 400,
          message: "Invalid Theka reference for this payment.",
        },
        THEKA_NOT_FOUND: {
          status: 404,
          message: "The associated Theka was not found.",
        },
        THEKA_VERIFICATION_UPDATE_FAILED: {
          status: 500,
          message:
            "Payment was received, but registration status could not be updated.",
        },
      };

      const mapped = errors[code];

      if (mapped) {
        return res.status(mapped.status).json({
          success: false,
          message: mapped.message,
        });
      }

      console.error("Payment verification error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to verify payment",
      });
    }
  }
}

export const paymentController = new PaymentController();
