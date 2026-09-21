
import {
  and,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../db";
import { passwordResetOtps } from "../db/schema";

export class PasswordResetOtpRepository {
  // Create a new password reset OTP
 async create(data: {
  userId: number;
  otpHash: string;
}) {
  const [otp] = await db
    .insert(passwordResetOtps)
    .values({
      userId: data.userId,
      otpHash: data.otpHash,
      expiresAt: sql`CURRENT_TIMESTAMP + INTERVAL '10 minutes'`,
    })
    .returning();

  return otp;
}

  // Get the latest active OTP for a user
  async findLatestActiveOtpByUserId(userId: number) {
    const [otp] = await db
      .select()
      .from(passwordResetOtps)
      .where(
        and(
          eq(passwordResetOtps.userId, userId),
          isNull(passwordResetOtps.usedAt),

          // Compare against PostgreSQL's current timestamp
          gt(passwordResetOtps.expiresAt, sql`CURRENT_TIMESTAMP`)
        )
      )
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1);

    return otp;
  }

  // Get OTP by its ID
  async findOtpById(id: number) {
    const [otp] = await db
      .select()
      .from(passwordResetOtps)
      .where(eq(passwordResetOtps.id, id))
      .limit(1);

    return otp;
  }

  // Increment failed OTP attempts
  async incrementAttempts(id: number) {
    const [otp] = await db
      .update(passwordResetOtps)
      .set({
        attempts: sql`${passwordResetOtps.attempts} + 1`,
      })
      .where(eq(passwordResetOtps.id, id))
      .returning();

    return otp;
  }

  // Mark OTP as used
  async markUsed(id: number) {
    const [otp] = await db
      .update(passwordResetOtps)
      .set({
        usedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(passwordResetOtps.id, id))
      .returning();

    return otp;
  }

  // Invalidate all previous active OTPs for a user
  async invalidatePreviousOtps(userId: number) {
    return db
      .update(passwordResetOtps)
      .set({
        usedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(passwordResetOtps.userId, userId),
          isNull(passwordResetOtps.usedAt)
        )
      );
  }

  // Delete expired and old used OTPs
  async deleteOldOtps() {
    const cutoff = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    return db
      .delete(passwordResetOtps)
      .where(
        or(
          // Delete expired OTPs
          lt(passwordResetOtps.expiresAt, sql`CURRENT_TIMESTAMP`),

          // Delete used OTPs older than 24 hours
          and(
            isNotNull(passwordResetOtps.usedAt),
            lt(passwordResetOtps.usedAt, sql`${cutoff}`)
          )
        )
      );
  }
}

export const passwordResetOtpRepository =
  new PasswordResetOtpRepository();

