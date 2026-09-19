import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendPasswordResetOtp(
    email: string,
    otp: string
  ): Promise<void> {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Find My Theka - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Find My Theka</h2>

          <p>You requested to reset your password.</p>

          <p>Your password reset OTP is:</p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>This OTP will expire in 10 minutes.</p>

          <p>If you did not request a password reset, you can safely ignore this email.</p>

          <br />

          <p>Regards,<br />Find My Theka Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error("Failed to send password reset email");
    }

    console.log("Password reset email sent:", data?.id);
  },
};