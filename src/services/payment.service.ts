import { razorpayService } from "./razorpay.service";
import { paymentRepository } from "../repositories/payment.repository";

import type {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from "../types/payment.types";

export class PaymentService {
 async createPaymentOrder(input: CreatePaymentOrderInput) {
  if (!Number.isSafeInteger(input.userId) || input.userId <= 0) {
    throw new Error("INVALID_USER_ID");
  }

  if (!input.referenceId?.trim()) {
    throw new Error("INVALID_REFERENCE_ID");
  }

  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("INVALID_PAYMENT_AMOUNT");
  }

  const order = await razorpayService.createOrder({
    amount: input.amount,
    currency: "INR",
    receipt: `pay_${input.userId}_${Date.now()}`,
    notes: {
      purpose: input.purpose,
      referenceId: input.referenceId,
      userId: String(input.userId),
    },
  });

  // Persist the validated amount, not the SDK's wider number|string type.
  if (Number(order.amount) !== input.amount) {
    throw new Error("RAZORPAY_ORDER_AMOUNT_MISMATCH");
  }

  try {
    await paymentRepository.create({
      userId: input.userId,
      purpose: input.purpose,
      referenceId: input.referenceId,
      razorpayOrderId: order.id,
      amount: input.amount,
      currency: "INR",
      description: input.description,
      metadata: input.metadata ?? {},
      status: "CREATED",
    });
  } catch (error) {
    console.error("Payment record persistence failed", {
      orderId: order.id,
      userId: input.userId,
    });

    throw error;
  }

  return {
    orderId: order.id,
    amount: input.amount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID!,
  };
}
 
async getRegistrationPayment(userId: number, thekaId: string) {
  return paymentRepository.findLatestByPurposeAndReference({
    userId,
    purpose: "THEKA_REGISTRATION",
    referenceId: thekaId,
  });
}

async syncAlreadyPaidPayment(orderId: string, paymentId: string) {
  return paymentRepository.markPaidAndVerifyTheka({
    orderId,
    paymentId,
  });
}

async verifyCheckoutPayment(
  userId: number,
  input: VerifyPaymentInput,
) {
  const record = await paymentRepository.findByOrderId(input.orderId);

  if (!record) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (record.userId !== userId) {
    throw new Error("PAYMENT_FORBIDDEN");
  }

  if (record.status === "PAID") {
    if (record.razorpayPaymentId !== input.paymentId) {
      throw new Error("PAYMENT_ALREADY_COMPLETED");
    }

    // Repair the Theka status too if an earlier operation left it pending.
    return paymentRepository.markPaidAndVerifyTheka({
      orderId: record.razorpayOrderId,
      paymentId: input.paymentId,
    });
  }

  if (record.status !== "CREATED") {
    throw new Error("PAYMENT_NOT_PAYABLE");
  }

  const validSignature = razorpayService.verifyPaymentSignature(
    record.razorpayOrderId,
    input.paymentId,
    input.signature,
  );

  if (!validSignature) {
    throw new Error("INVALID_PAYMENT_SIGNATURE");
  }

  const [payment, order] = await Promise.all([
    razorpayService.fetchPayment(input.paymentId),
    razorpayService.fetchOrder(record.razorpayOrderId),
  ]);

  if (
    payment.order_id !== record.razorpayOrderId ||
    order.id !== record.razorpayOrderId ||
    Number(payment.amount) !== record.amount ||
    Number(order.amount) !== record.amount ||
    payment.currency !== record.currency ||
    order.currency !== record.currency
  ) {
    throw new Error("PAYMENT_DETAILS_MISMATCH");
  }

  if (payment.status !== "captured") {
    return {
      success: false as const,
      status: payment.status,
      message: "Payment is not captured yet",
    };
  }

  return paymentRepository.markPaidAndVerifyTheka({
    orderId: record.razorpayOrderId,
    paymentId: input.paymentId,
  });
}

}

export const paymentService = new PaymentService();