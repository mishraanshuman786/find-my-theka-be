
import type { Request, Response } from "express";
import { passwordResetService } from "../services/password-reset.service";
import { AppError } from "../utils/app-error";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/password-reset.validation";

export class PasswordResetController {
  // POST /auth/forgot-password
  async forgotPassword(req: Request, res: Response) {
    const validation = forgotPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues[0]?.message || "Invalid request data",
        400,
      );
    }

    const { email } = validation.data;

    await passwordResetService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
    });
  }

  // POST /auth/reset-password
  async resetPassword(req: Request, res: Response) {
    const validation = resetPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues[0]?.message || "Invalid request data",
        400,
      );
    }

    const { email, otp, newPassword } = validation.data;

    await passwordResetService.resetPassword(email, otp, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  }
}

export const passwordResetController = new PasswordResetController();
