import {z} from "zod";

export const verifyGstinSchema=z.object({
  gstin:z.string().trim().toUpperCase().length(15,"Gstin must contain 15 characters.").regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Invalid GSTIN format")
});

