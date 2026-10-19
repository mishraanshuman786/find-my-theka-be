
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

  private matchesRegistration(
    theka: Awaited<ReturnType<ThekaRepository["findById"]>>,
    userId: number,
    data: CreateThekaInput,
  ) {
    if (!theka || theka.ownerUserId !== userId) {
      return false;
    }

    return (
      theka.name === data.name &&
      theka.contactPhone === data.contactPhone &&
      theka.address === data.address &&
      theka.city === data.city &&
      theka.state === data.state &&
      theka.pincode === data.pincode &&
      Number(theka.latitude) === data.latitude &&
      Number(theka.longitude) === data.longitude &&
      theka.aadhaarNumber === data.aadhaarNumber &&
      theka.gstNumber === data.gstNumber.trim().toUpperCase() &&
      theka.licenseNumber === data.licenseNumber &&
      theka.licenseExpiryDate === data.licenseExpiryDate
    );
  }

  private async continueRegistration(
    userId: number,
    theka: NonNullable<
      Awaited<ReturnType<ThekaRepository["findById"]>>
    >,
    amount: number,
  ) {
    const existingPayment = await paymentService.getRegistrationPayment(
      userId,
      String(theka.id),
    );

    if (existingPayment?.status === "PAID") {
      const result = await paymentService.syncAlreadyPaidPayment(
        existingPayment.razorpayOrderId,
        existingPayment.razorpayPaymentId!,
      );

      return {
        success: true as const,
        message: "Registration payment is already completed.",
        data: {
          theka: {
            ...theka,
            status: result.thekaStatus ?? "VERIFIED",
          },
          payment: null,
          nextStep: "COMPLETE" as const,
        },
      };
    }

    if (existingPayment?.status === "CREATED") {
      return {
        success: true as const,
        message: "Continue your existing registration payment.",
        data: {
          theka,
          payment: {
            orderId: existingPayment.razorpayOrderId,
            amount: existingPayment.amount,
            currency: existingPayment.currency,
            keyId: process.env.RAZORPAY_KEY_ID!,
          },
          nextStep: "COMPLETE_PAYMENT" as const,
        },
      };
    }

    const payment = await paymentService.createPaymentOrder({
      userId,
      purpose: "THEKA_REGISTRATION",
      referenceId: String(theka.id),
      amount,
      description: `Registration fee for theka ${theka.id}`,
      metadata: {
        thekaId: String(theka.id),
        gstin: theka.gstNumber,
      },
    });

    return {
      success: true as const,
      message: "Theka created. Complete payment to continue.",
      data: {
        theka,
        payment,
        nextStep: "COMPLETE_PAYMENT" as const,
      },
    };
  }

  async createTheka(
    userId: number,
    data: CreateThekaInput,
    requestKey: string,
  ) {
    const gstin = data.gstNumber.trim().toUpperCase();

    // Retry: reuse the existing registration for this user and key.
    let theka = await this.thekaRepository.findByRegistrationRequestKey(
      userId,
      requestKey,
    );

    if (theka) {
      if (!this.matchesRegistration(theka, userId, data)) {
        throw new Error("IDEMPOTENCY_KEY_REUSED");
      }
    } else {
      const verified = await gstVerificationService.isVerified(
        String(userId),
        gstin,
      );

      if (!verified) {
        return {
          success: false as const,
          code: "GST_VERIFICATION_REQUIRED",
          message: "Please verify your GSTIN before registering your Theka.",
        };
      }

      const amount = Number(
        process.env.THEKA_REGISTRATION_FEE_PAISE,
      );

      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error("THEKA_REGISTRATION_FEE_NOT_CONFIGURED");
      }

      try {
        theka = await this.thekaRepository.create({
          ownerUserId: userId,
          registrationRequestKey: requestKey,
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
      } catch (error) {
        // A concurrent request may have inserted this same key first.
        const existing = await this.thekaRepository
          .findByRegistrationRequestKey(userId, requestKey);

        if (!existing) {
          throw error;
        }

        theka = existing;

        if (!this.matchesRegistration(theka, userId, data)) {
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        }
      }
    }

    const amount = Number(
      process.env.THEKA_REGISTRATION_FEE_PAISE,
    );

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("THEKA_REGISTRATION_FEE_NOT_CONFIGURED");
    }

    try {
      return await this.continueRegistration(userId, theka, amount);
    } catch (error) {
      console.error(
        `Payment setup failed for Theka ${theka.id}:`,
        error,
      );

      return {
        success: false as const,
        code: "PAYMENT_ORDER_CREATION_FAILED",
        message:
          "Your registration was saved. Please retry payment using the same registration attempt.",
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

  async getThekaById(thekaId: number, userId: number) {
    return this.thekaRepository.findByIdAndOwnerUserId(
      thekaId,
      userId,
    );
  }
}

export const thekaService = new ThekaService(thekaRepository);
