
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (isTest ? "silent" : isProduction ? "info" : "debug"),

  base: {
    service: "find-my-theka-backend",
    env: process.env.NODE_ENV || "development",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  formatters: {
    level(label) {
      return { level: label };
    },
  },

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "headers.authorization",
      "password",
      "newPassword",
      "otp",
      "otpHash",
      "token",
      "idToken",
      "accessToken",
      "refreshToken",
      "signature",
      "req.body.password",
      "req.body.newPassword",
      "req.body.otp",
      "req.body.idToken",
    ],
    censor: "[REDACTED]",
  },

  ...(
    !isTest &&
    (
      process.env.LOG_PRETTY === "true" ||
      (!isProduction && process.env.LOG_PRETTY !== "false")
    )
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
              singleLine: false,
              errorLikeObjectKeys: ["err", "error"],
            },
          },
        }
      : {}
  ),
});

export default logger;
