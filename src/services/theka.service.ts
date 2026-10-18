
import {
  thekaRepository,
  ThekaRepository,
} from "../repositories/theka.repository";

import { CreateThekaInput } from "../validators/theka.validation";
import { paymentService } from "./payment.service";
import { gstVerificationService } from "./gst-verification.service";

export class ThekaService {
  constructor(
    private readonly thekaRepository: ThekaRepository,
  ) {}

  async createTheka(
    userId: number,
    data: CreateThekaInput,
  ) {
    const gstin = data.gstNumber.trim().toUpperCase();

    // Step 1: Ensure this user has verified this exact GSTIN.
    // If verification is missing or expired, do not create a Theka.
    const verified = await gstVerificationService.isVerified(
      String(userId),
      gstin,
    );

    if (!verified) {
      return {
        success: false as const,
        code: "GST_VERIFICATION_REQUIRED",
        message:
          "Please verify your GSTIN before registering your Theka.",
      };
    }

    // Step 2: Read the registration fee from backend configuration.
    // The frontend must never decide the amount.
    const amount = Number(
      process.env.THEKA_REGISTRATION_FEE_PAISE,
    );

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("THEKA_REGISTRATION_FEE_NOT_CONFIGURED");
    }

    // Step 3: Create the Theka only after GST verification passes.
    const theka = await this.thekaRepository.create({
      ownerUserId: userId,
      name: data.name,
      contactPhone: data.contactPhone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      latitude: data.latitude.toString(),
      longitude: data.longitude.toString(),
      aadhaarNumber: data.aadhaarNumber,
      gstNumber: gstin,
      licenseNumber: data.licenseNumber,
      licenseExpiryDate: data.licenseExpiryDate,
      status: "PENDING",
    });

    // Step 4: Create the Razorpay payment order.
    try {
      const payment = await paymentService.createPaymentOrder({
        userId,
        purpose: "THEKA_REGISTRATION",
        referenceId: String(theka.id),
        amount,
        description: `Registration fee for theka ${theka.id}`,
        metadata: {
          thekaId: String(theka.id),
          gstin,
        },
      });

      // Step 5: Return Theka and payment details.
      // Payment is not complete merely because an order was created.
      return {
        success: true as const,
        message:
          "Theka created and GST verified. Complete payment to continue.",
        data: {
          theka,
          payment,
          nextStep: "COMPLETE_PAYMENT" as const,
        },
      };
    } catch (error) {
      // The Theka has already been created. Preserve its ID so the
      // frontend/backend can support retrying payment without creating
      // duplicate Theka records.
      console.error(
        `Failed to create payment order for Theka ${theka.id}:`,
        error,
      );

      return {
        success: false as const,
        code: "PAYMENT_ORDER_CREATION_FAILED",
        message:
          "Theka was created, but payment setup failed. Please retry payment.",
        data: {
          theka,
          payment: null,
          nextStep: "RETRY_PAYMENT" as const,
        },
      };
    }
  }

  async getMyThekas(userId: number) {
    return this.thekaRepository.findByOwnerUserId(userId);
  }

  async getThekaById(
    thekaId: number,
    userId: number,
  ) {
    return this.thekaRepository.findByIdAndOwnerUserId(
      thekaId,
      userId,
    );
  }
}

export const thekaService = new ThekaService(
  thekaRepository,
);
