import { createHmac, timingSafeEqual } from "node:crypto";

import { razorpay } from "../config/razorpay";
import { AppError } from "../utils/app-error";

export interface CreateRazorpayOrderInput {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  async createOrder(input: CreateRazorpayOrderInput) {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
      throw new AppError("INVALID_PAYMENT_AMOUNT", 400);
    }

    if (
      typeof input.receipt !== "string" ||
      !input.receipt.trim() ||
      input.receipt.length > 40
    ) {
      throw new AppError("INVALID_PAYMENT_RECEIPT", 400);
    }

    try {
      return await razorpay.orders.create({
        amount: input.amount,
        currency: input.currency ?? "INR",
        receipt: input.receipt,
        notes: input.notes,
      });
    } catch (error) {
      console.error("Razorpay order creation failed", error);

      throw new AppError("RAZORPAY_ORDER_CREATION_FAILED", 502);
    }
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || !orderId || !paymentId || !signature) {
      return false;
    }

    const expected = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Reject malformed signatures before comparing.
    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      return false;
    }

    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }

  async fetchPayment(paymentId: string) {
    if (typeof paymentId !== "string" || !paymentId.trim()) {
      throw new AppError("INVALID_PAYMENT_ID", 400);
    }

    try {
      return await razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error("Razorpay payment fetch failed", error);

      throw new AppError("RAZORPAY_PAYMENT_FETCH_FAILED", 502);
    }
  }

  async fetchOrder(orderId: string) {
    if (typeof orderId !== "string" || !orderId.trim()) {
      throw new AppError("INVALID_ORDER_ID", 400);
    }

    try {
      return await razorpay.orders.fetch(orderId);
    } catch (error) {
      console.error("Razorpay order fetch failed", error);

      throw new AppError("RAZORPAY_ORDER_FETCH_FAILED", 502);
    }
  }
}

export const razorpayService = new RazorpayService();
