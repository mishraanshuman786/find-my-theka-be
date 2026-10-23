import { AppError } from "../utils/app-error";
import type {
  GstinCheckResponse,
  GstBalanceResponse,
  GstValidationResult,
} from "../types/gst-validation.types";

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export class GstValidationService {
  private getConfig() {
    const apiKey = process.env.GSTIN_CHECK_API_KEY;

    if (!apiKey) {
  throw new AppError("GST_PROVIDER_NOT_CONFIGURED", 500);
}

    const baseUrl = (
      process.env.GSTIN_CHECK_BASE_URL ??
      "https://sheet.gstincheck.co.in"
    ).replace(/\/+$/, "");

    const timeoutMs = Number(
      process.env.GSTIN_CHECK_TIMEOUT_MS ?? 10000,
    );

    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000) {
  throw new AppError("GST_PROVIDER_CONFIGURATION_INVALID", 500);
}

    return { apiKey, baseUrl, timeoutMs };
  }

  private async getJson<T>(url: string, timeoutMs: number): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
     throw new AppError("GST_PROVIDER_UNAVAILABLE", 503);
    }

   if (response.status === 401 || response.status === 403) {
  throw new AppError("GST_PROVIDER_AUTH_FAILED", 502);
}

  if (response.status === 429) {
  throw new AppError("GST_PROVIDER_RATE_LIMITED", 503);
}
   if (response.status >= 500) {
  throw new AppError("GST_PROVIDER_UNAVAILABLE", 503);
}

 if (!response.ok) {
  throw new AppError("GST_PROVIDER_REQUEST_FAILED", 502);
}

    try {
      return (await response.json()) as T;
    } catch {
      throw new AppError("GST_PROVIDER_INVALID_RESPONSE",502);
    }
  }

  /**
   * Check remaining credits before spending one on a GSTIN lookup.
   */
  async getCreditBalance(): Promise<number> {
    const { apiKey, baseUrl, timeoutMs } = this.getConfig();

    const result = await this.getJson<GstBalanceResponse>(
      `${baseUrl}/balance/${encodeURIComponent(apiKey)}`,
      timeoutMs,
    );

    if (
      result.flag !== true ||
      typeof result.data !== "number" ||
      !Number.isFinite(result.data) ||
      result.data < 0
    ) {
      throw new AppError("GST_BALANCE_UNAVAILABLE", 502);
    }

    return result.data;
  }

  /**
   * Validate a GSTIN already retrieved from the thekas table.
   */
  async validateGstin(gstinInput: string): Promise<GstValidationResult> {
    const gstin = gstinInput.trim().toUpperCase();

    // Step 1: validate format before making any API calls.
    if (!GSTIN_REGEX.test(gstin)) {
      throw new AppError("INVALID_GSTIN_FORMAT", 400);
    }

    const { apiKey, baseUrl, timeoutMs } = this.getConfig();

    // Step 2: check credits before calling the validation endpoint.
    const creditsRemaining = await this.getCreditBalance();

    if (creditsRemaining < 1) {
      throw new AppError("GST_CREDITS_INSUFFICIENT", 503);
    }

    // Step 3: validate the GSTIN.
    const result = await this.getJson<GstinCheckResponse>(
      `${baseUrl}/check/${encodeURIComponent(apiKey)}/${encodeURIComponent(gstin)}`,
      timeoutMs,
    );

    // A successful HTTP request can still mean the GSTIN was not found.
    if (result.flag === false) {
      return {
        gstin,
        valid: false,
        registrationStatus: null,
        legalName: null,
        tradeName: null,
        registrationDate: null,
        cancellationDate: null,
        message: result.message || "GSTIN was not found",
        creditsRemaining,
        checkedAt: new Date().toISOString(),
      };
    }

    if (result.flag !== true || !result.data) {
      throw new AppError("GST_PROVIDER_INVALID_RESPONSE", 502);
    }

    const data = result.data;

    // Ensure the provider returned the same GSTIN we requested.
    if (
      typeof data.gstin !== "string" ||
      data.gstin.trim().toUpperCase() !== gstin
    ) {
      throw new AppError("GST_PROVIDER_GSTIN_MISMATCH", 502);
    }

    if (typeof data.sts !== "string" || !data.sts.trim()) {
      throw new AppError("GST_PROVIDER_INVALID_RESPONSE", 502);
    }

    const registrationStatus = data.sts.trim();
    const valid = registrationStatus.toLowerCase() === "active";

    return {
      gstin,
      valid,
      registrationStatus,
      legalName: data.lgnm ?? null,
      tradeName: data.tradeNam ?? null,
      registrationDate: data.rgdt ?? null,
      cancellationDate: data.cxdt?.trim() ? data.cxdt : null,
      message: valid
        ? "GSTIN is active"
        : `GST registration status is ${registrationStatus}`,
      creditsRemaining,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const gstValidationService = new GstValidationService();
