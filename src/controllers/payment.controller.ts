
import type { Request, Response } from "express";
import { verifyPaymentSchema } from "../validators/payment.validation";
import { paymentService } from "../services/payment.service";
import { AppError } from "../utils/app-error";

export class PaymentController {
  async verifyCheckoutPayment(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const parsed = verifyPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification data",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await paymentService.verifyCheckoutPayment(
      req.user.userId,
      parsed.data,
    );

    return res.status(result.success ? 200 : 202).json({
      success: result.success,
      data: result,
    });
  }
}

export const paymentController = new PaymentController();
