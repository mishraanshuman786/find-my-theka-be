
import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),

    phone: z.preprocess(
      (value) => {
        // Treat an empty string as a request to remove the phone number.
        if (typeof value === "string" && value.trim() === "") {
          return null;
        }

        return value;
      },
      z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
        .nullable()
        .optional(),
    ),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.phone !== undefined,
    {
      message: "At least one field (name or phone) is required",
    },
  );

  
export const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 bytes",
      ),
  })
  .strict();



export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Invalid current password",
      ),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "New password must not exceed 72 bytes",
      ),
  })
  .strict()
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: "New password must be different from current password",
      path: ["newPassword"],
    },
  );

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;


export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
