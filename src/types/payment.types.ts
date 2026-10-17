export const PAYMENT_PURPOSES=[
    "THEKA_REGISTRATION",
    "SUBSCRIPTION",
    "PREMIUM_FEATURE",
    "OTHER"
] as const;

export type PaymentPuspose=(typeof PAYMENT_PURPOSES)[number];

export type PaymentStatus=| "CREATED" | "PAID" | "FAILED";

export interface CreatePaymentOrderInput{
    userId:number;
    purpose:PaymentPuspose;
    referenceId:string;
    amount: number; // in paise
    description?:string;
    metadata?: Record<string, string>;
}

export interface VerifyPaymentInput{
    orderId:string;
    paymentId:string;
    signature:string;
}