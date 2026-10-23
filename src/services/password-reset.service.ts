import bcrypt from "bcryptjs";
import { AppError } from "../utils/app-error";
import { userRepository } from "../repositories/user.repository";
import { passwordResetOtpRepository } from "../repositories/password-reset-otp.repository";
import { emailService } from "../emails/email.service";
import { generateOtp } from "../utils/otp";

export class PasswordResetService {
  // generate and send the otp through email
  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await userRepository.findByEmail(normalizedEmail);

    // Do not reveal whether the email exists
    if (!user) {
      return;
    }

    // Generate OTP
    const otp = generateOtp();

    // Hash OTP before storing
    const otpHash = await bcrypt.hash(otp, 10);

    // Send email before modifying the database
    await emailService.sendForgotPasswordOtp(user.email, otp);

    // Only modify the database after email succeeds
    await passwordResetOtpRepository.invalidatePreviousOtps(user.id);

    await passwordResetOtpRepository.create({
      userId: user.id,
      otpHash,
    });
  }

  // verify otp and update password
  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError("Invalid OTP!", 400);
    }

    const resetOtp =
      await passwordResetOtpRepository.findLatestActiveOtpByUserId(user.id);

    if (!resetOtp) {
      throw new AppError("OTP Expired or Invalid!", 400);
    }

    // Maximum Attempts
    if (resetOtp.attempts >= 5) {
      throw new AppError("Too Many OTP Attempts!", 429);
    }

    // check Otp
    const valid = await bcrypt.compare(otp, resetOtp.otpHash);

    // not valid
    if (!valid) {
      await passwordResetOtpRepository.incrementAttempts(resetOtp.id);

      throw new AppError("Invalid OTP!", 400);
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update Password
    await userRepository.updatePassword(user.id, hashedPassword);

    // Mark Otp as Used
    await passwordResetOtpRepository.markUsed(resetOtp.id);

    return true;
  }
}

export const passwordResetService = new PasswordResetService();
