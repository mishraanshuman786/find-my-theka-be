import bcrypt from "bcryptjs";
import { AppError } from "../utils/app-error";
import { userRepository } from "../repositories/user.repository";
import { passwordResetOtpRepository } from "../repositories/password-reset-otp.repository";
import { emailService } from "../emails/email.service";
import { generateOtp } from "../utils/otp";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { users, passwordResetOtps } from "../db/schema";

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
 async resetPassword(
  email: string,
  otp: string,
  newPassword: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid OTP!", 400);
  }

  // All OTP verification and password changes happen in one transaction.
  const result = await db.transaction(async (tx:any) => {
    // Lock the latest active OTP so another request cannot consume it
    // while this transaction is verifying it.
    const [resetOtp] = await tx
      .select()
      .from(passwordResetOtps)
      .where(
        and(
          eq(passwordResetOtps.userId, user.id),
          isNull(passwordResetOtps.usedAt),
          gt(passwordResetOtps.expiresAt, sql`CURRENT_TIMESTAMP`),
        ),
      )
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1)
      .for("update");

    if (!resetOtp) {
      return { status: "invalid" as const };
    }

    // Maximum five attempts.
    if (resetOtp.attempts >= 5) {
      return { status: "too_many_attempts" as const };
    }

    const isValidOtp = await bcrypt.compare(
      otp,
      resetOtp.otpHash,
    );

    if (!isValidOtp) {
      // Increment attempts inside the transaction.
      await tx
        .update(passwordResetOtps)
        .set({
          attempts: sql`${passwordResetOtps.attempts} + 1`,
        })
        .where(eq(passwordResetOtps.id, resetOtp.id));

      // Returning instead of throwing allows the attempt increment
      // to commit.
      return { status: "invalid" as const };
    }

    // Hash the new password.
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password.
    const [updatedUser] = await tx
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
      });

    if (!updatedUser) {
      return { status: "user_not_found" as const };
    }

    // Consume the OTP in the same transaction.
    await tx
      .update(passwordResetOtps)
      .set({
        usedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(passwordResetOtps.id, resetOtp.id),
          isNull(passwordResetOtps.usedAt),
        ),
      );

    return { status: "success" as const };
  });

  // Handle errors AFTER the transaction has completed.
  if (result.status === "invalid") {
    throw new AppError("OTP Expired or Invalid!", 400);
  }

  if (result.status === "too_many_attempts") {
    throw new AppError("Too Many OTP Attempts!", 429);
  }

  if (result.status === "user_not_found") {
    throw new AppError("User not found!", 404);
  }

  return true;
}
}

export const passwordResetService = new PasswordResetService();
