import { Request, Response } from "express";

import { passwordResetService } from "../services/password-reset.service";

export class PasswordResetController {
  // Post /auth/forgot-password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required!",
        });
      }

      await passwordResetService.forgotPassword(email);

      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    } catch (error) {
      console.error("Forgot Password error:", error);
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }

  // Post /auth/reset-password
  async resetPassword(req: Request, res: Response) {
    try {
      const { otp, email, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, OTP and new password are required!",
        });
      }

      //  Basic Password Validation
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters!",
        });
      }

      // OTP should be 6 digits
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: "OTP must be a 6-digit number!",
        });
      }

      await passwordResetService.resetPassword(email, otp, newPassword);

      return res.status(200).json({
        success: true,
        message: "Password reset successfully.",
      });
    } catch (error) {
      console.error("Reset password error:", error);

      if (error instanceof Error) {
        if (
          error.message === "Invalid OTP!" ||
          error.message === "OTP Expired or Invalid!" ||
          error.message === "Too Many OTP Attempts!"
        ) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
}

export const passwordResetController = new PasswordResetController();
