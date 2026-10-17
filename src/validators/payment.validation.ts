import { z } from "zod";

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1).max(100),
  paymentId: z.string().min(1).max(100),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});