import {and, eq} from "drizzle-orm";
import { db } from "../db";
import { payments } from "../db/schema";

export class PaymentRepository{
    async create(data: typeof payments.$inferInsert){
        const [payment]=await db.insert(payments).values(data).returning();
        return payment;
    }

    async findByOrderId(orderId:string){
        const [payment]=await db.select().from(payments).where(eq(payments.razorpayOrderId, orderId)).limit(1);

        return payment;
    }

    async markPaid(input:{
        orderId: string,
        paymentId: string
    }){
        return db.transaction(async (tx:any)=>{
           const [existing]=await tx.select().from(payments).where(eq(payments.razorpayOrderId, input.orderId)).limit(1).for("update");

           if(!existing){
            throw new Error("PAYMENT_NOT_FOUND");
           }

           if (existing.status === "PAID") {
        if (existing.razorpayPaymentId !== input.paymentId) {
          throw new Error("PAYMENT_ALREADY_COMPLETED");
        }

        return existing;
      }

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

      return updated;
        })
    }
}

export const paymentRepository=new PaymentRepository();