import { z } from "zod";

export const createThekaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Theka name must be at least 2 characters")
    .max(150, "Theka name must not exceed 150 characters"),

  contactPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must not exceed 500 characters"),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),

  state: z
    .string()
    .trim()
    .min(2, "State must be at least 2 characters")
    .max(100, "State must not exceed 100 characters"),

  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Invalid pincode"),

  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),

  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),

  aadhaarNumber: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar number must be 12 digits"),

  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Invalid GST number",
    ),

  licenseNumber: z
    .string()
    .trim()
    .min(3, "License number must be at least 3 characters")
    .max(100, "License number must not exceed 100 characters"),
  licenseExpiryDate: z.iso.date(),
});

export type CreateThekaInput = z.infer<typeof createThekaSchema>;