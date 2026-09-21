import { Resend } from "resend";
import { render } from "react-email";

import {ForgotPasswordEmail} from "./templates/forgot-password";

const resend=new Resend(process.env.RESEND_API_KEY);

export class EmailService{
    async sendForgotPasswordOtp(to:string, otp:string ){
        const html=await render(ForgotPasswordEmail({otp}));

        const {data, error}=await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to:[to],
            subject:"Reset your Find My Theka password",
            html
        });

        if(error){
            throw new Error(error.message);
        }

        return data;
    }
}

export const emailService=new EmailService();

