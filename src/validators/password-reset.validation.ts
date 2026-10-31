import { z } from "zod";

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),

    otp: z.string().regex(
      /^\d{6}$/,
      "OTP must be a 6-digit number",
    ),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 bytes",
      ),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;