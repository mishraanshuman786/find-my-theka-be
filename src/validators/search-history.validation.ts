import type { RequestHandler } from "express";
import {z} from "zod";

export const saveLocationSchema=z.object({
    label: z.string().trim().min(1,"Label cannot be empty!").max(100,"Label cannot exceed 100 characters!"),
    latitude: z.number().finite().min(-90,"Latitude must be between -90 and 90!").max(90,"Latitude must be between -90 and 90!"),
    longitude: z.number().finite().min(-180,"Longitude must be between -180 and 180!").max(180,"Longitude must be between -180 and 180!")
});

export const renameSavedLocationSchema=z.object({
    label: z.string().trim().min(1,"Label cannot be empty!").max(100,"Label cannot exceed 100 characters!")
});

export const savedLocationIdSchema=z.object({
    id: z.string().regex(/^[1-9]\d*$/, "Invalid saved location ID").refine(
      (value) => Number.isSafeInteger(Number(value)),
      "Invalid saved location ID",
    )
});


export type SaveLocationInput=z.infer<typeof saveLocationSchema>;
export type RenameSavedLocationInput=z.infer<typeof renameSavedLocationSchema>;

