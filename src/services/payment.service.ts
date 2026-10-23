import { razorpayService } from "./razorpay.service";
import { paymentRepository } from "../repositories/payment.repository";
import { AppError } from "../utils/app-error";
import type {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from "../types/payment.types";

export class PaymentService {
 async createPaymentOrder(input: CreatePaymentOrderInput) {
  if (!Number.isSafeInteger(input.userId) || input.userId <= 0) {
    throw new AppError("INVALID_USER_ID", 400);
  }

  if (!input.referenceId?.trim()) {
    throw new AppError("INVALID_REFERENCE_ID", 400);
  }

  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new AppError("INVALID_PAYMENT_AMOUNT", 400);
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
    throw new AppError("RAZORPAY_ORDER_AMOUNT_MISMATCH", 502);
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
    throw new AppError("PAYMENT_NOT_FOUND", 404);
  }

  if (record.userId !== userId) {
    throw new AppError("PAYMENT_FORBIDDEN", 403);
  }

  if (record.status === "PAID") {
    if (record.razorpayPaymentId !== input.paymentId) {
      throw new AppError("PAYMENT_ALREADY_COMPLETED", 409);
    }

    // Repair the Theka status too if an earlier operation left it pending.
    return paymentRepository.markPaidAndVerifyTheka({
      orderId: record.razorpayOrderId,
      paymentId: input.paymentId,
    });
  }

  if (record.status !== "CREATED") {
    throw new AppError("PAYMENT_NOT_PAYABLE", 409);
  }

  const validSignature = razorpayService.verifyPaymentSignature(
    record.razorpayOrderId,
    input.paymentId,
    input.signature,
  );

  if (!validSignature) {
    throw new AppError("INVALID_PAYMENT_SIGNATURE", 400);
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
    throw new AppError("PAYMENT_DETAILS_MISMATCH", 400);
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