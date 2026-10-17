import { createHmac, timingSafeEqual } from "node:crypto";
import { razorpay } from "../config/razorpay";

export interface CreateRazorpayOrderInput {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  async createOrder(input: CreateRazorpayOrderInput) {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
      throw new Error("INVALID_PAYMENT_AMOUNT");
    }

    if (!input.receipt.trim() || input.receipt.length > 40) {
      throw new Error("INVALID_PAYMENT_RECEIPT");
    }

    return razorpay.orders.create({
      amount: input.amount,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      notes: input.notes,
    });
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
    if (!paymentId.trim()) {
      throw new Error("INVALID_PAYMENT_ID");
    }

    return razorpay.payments.fetch(paymentId);
  }

  async fetchOrder(orderId: string) {
    if (!orderId.trim()) {
      throw new Error("INVALID_ORDER_ID");
    }

    return razorpay.orders.fetch(orderId);
  }
}

export const razorpayService = new RazorpayService();