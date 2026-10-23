
import type { Request, Response } from "express";
import { passwordResetService } from "../services/password-reset.service";
import { AppError } from "../utils/app-error";

export class PasswordResetController {
  // POST /auth/forgot-password
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      throw new AppError("Email is required!", 400);
    }

    await passwordResetService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
    });
  }

  // POST /auth/reset-password
  async resetPassword(req: Request, res: Response) {
    const { email, otp, newPassword } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof otp !== "string" ||
      !otp ||
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      throw new AppError(
        "Email, OTP and new password are required!",
        400,
      );
    }

    if (newPassword.length < 6) {
      throw new AppError(
        "Password must be at least 6 characters!",
        400,
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      throw new AppError("OTP must be a 6-digit number!", 400);
    }

    await passwordResetService.resetPassword(
      email,
      otp,
      newPassword,
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  }
}

export const passwordResetController = new PasswordResetController();
