
import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import { payments, thekas } from "../db/schema";

export class PaymentRepository {
  async create(data: typeof payments.$inferInsert) {
    const [payment] = await db
      .insert(payments)
      .values(data)
      .returning();

    return payment;
  }

  async findByOrderId(orderId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, orderId))
      .limit(1);

    return payment;
  }

  async findLatestByPurposeAndReference(input: {
    userId: number;
    purpose: typeof payments.$inferInsert.purpose;
    referenceId: string;
  }) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, input.userId),
          eq(payments.purpose, input.purpose),
          eq(payments.referenceId, input.referenceId),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return payment;
  }

  async markPaidAndVerifyTheka(input: {
    orderId: string;
    paymentId: string;
  }) {
    return db.transaction(async (tx:any) => {
      const [existing] = await tx
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, input.orderId))
        .limit(1)
        .for("update");

      if (!existing) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      if (existing.status === "PAID") {
        if (existing.razorpayPaymentId !== input.paymentId) {
          throw new Error("PAYMENT_ALREADY_COMPLETED");
        }
      } else {
        if (existing.status !== "CREATED") {
          throw new Error("PAYMENT_NOT_PAYABLE");
        }

        const [updated] = await tx
          .update(payments)
          .set({
            status: "PAID",
            razorpayPaymentId: input.paymentId,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(payments.id, existing.id),
              eq(payments.status, "CREATED"),
            ),
          )
          .returning();

        if (!updated) {
          throw new Error("PAYMENT_UPDATE_FAILED");
        }
      }

      let thekaStatus: string | null = null;

      if (existing.purpose === "THEKA_REGISTRATION") {
        const thekaId = Number(existing.referenceId);

        if (!Number.isSafeInteger(thekaId) || thekaId <= 0) {
          throw new Error("INVALID_THEKA_REFERENCE");
        }

        const [theka] = await tx
          .select()
          .from(thekas)
          .where(eq(thekas.id, thekaId))
          .limit(1)
          .for("update");

        if (!theka || theka.ownerUserId !== existing.userId) {
          throw new Error("THEKA_NOT_FOUND");
        }

        // Payment has been confirmed, so the registration is verified
        // according to the current business requirement.
        const [updatedTheka] = await tx
          .update(thekas)
          .set({
            status: "VERIFIED",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(thekas.id, thekaId))
          .returning();

        if (!updatedTheka) {
          throw new Error("THEKA_VERIFICATION_UPDATE_FAILED");
        }

        thekaStatus = updatedTheka.status;
      }

      return {
        success: true as const,
        status: "PAID" as const,
        thekaStatus,
      };
    });
  }
}

export const paymentRepository = new PaymentRepository();
