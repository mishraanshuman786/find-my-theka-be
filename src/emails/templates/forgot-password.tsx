import React from "react";
import {Body, Container, Head, Heading, Html, Preview, Section, Text} from "react-email";

interface ForgotPasswordEmailProps{
    otp:string
}

export const ForgotPasswordEmail=({otp}:ForgotPasswordEmailProps)=>{
     return (
        <Html>
            <Head>
                <Preview>
                     Your Find My Theka password reset OTP
                </Preview>
            </Head>
            <Body>
        <Container>
          <Heading>
            Reset your Find My Theka password
          </Heading>

          <Text>
            We received a request to reset your password.
          </Text>

          <Text>
            Your OTP is:
          </Text>

          <Section>
            <Text>
              {otp}
            </Text>
          </Section>

          <Text>
            This OTP will expire in 10 minutes.
          </Text>

          <Text>
            If you did not request a password reset, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
        </Html>
     )
}