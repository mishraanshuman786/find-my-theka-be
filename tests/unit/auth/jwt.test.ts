import jwt from "jsonwebtoken";

import { describe, expect, it } from "vitest";

import {
  generateToken,
  verifyToken,
} from "../../../src/utils/jwt";

describe("JWT Utils", () => {
  const user = {
    id: 123,
    email: "test@example.com",
    name: "Test User",
    role: "USER" as const,
  };

  describe("generateToken", () => {
    it("should generate a JWT token", () => {
      const token = generateToken(user);

      expect(token).toBeTypeOf("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate a token containing the correct user data", () => {
      const token = generateToken(user);
      const decoded = verifyToken(token);

      expect(decoded).not.toHaveProperty("error");

      if ("error" in decoded) {
        throw new Error(
          `JWT verification failed: ${decoded.error}`
        );
      }

      expect(decoded).toMatchObject({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });

    it("should generate a token with a 7-day expiration", () => {
      const token = generateToken(user);
      const decoded = jwt.decode(token);

      expect(decoded).not.toBeNull();

      if (!decoded || typeof decoded === "string") {
        throw new Error("Failed to decode JWT");
      }

      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");

      const expirationTime = decoded.exp!;
      const issuedAt = decoded.iat!;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(expirationTime - issuedAt).toBe(
        sevenDaysInSeconds
      );
    });

    it("should generate a token with the ADMIN role", () => {
      const admin = {
        id: 456,
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN" as const,
      };

      const token = generateToken(admin);
      const decoded = verifyToken(token);

      expect(decoded).not.toHaveProperty("error");

      if ("error" in decoded) {
        throw new Error(
          `JWT verification failed: ${decoded.error}`
        );
      }

      expect(decoded).toMatchObject({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        role: "ADMIN",
      });
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid JWT token", () => {
      const token = generateToken(user);
      const decoded = verifyToken(token);

      expect(decoded).not.toHaveProperty("error");

      if ("error" in decoded) {
        throw new Error(
          `JWT verification failed: ${decoded.error}`
        );
      }

      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.name).toBe(user.name);
      expect(decoded.role).toBe(user.role);
    });

    it("should reject an invalid JWT token", () => {
      const decoded = verifyToken("invalid-token");

      expect(decoded).toEqual({
        error: "Invalid Token!",
      });
    });

    it("should reject a tampered JWT token", () => {
      const token = generateToken(user);
      const tamperedToken = `${token}tampered`;

      const decoded = verifyToken(tamperedToken);

      expect(decoded).toEqual({
        error: "Invalid Token!",
      });
    });

    it("should return Token Expired for an expired JWT", () => {
      const expiredToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        "findmytheka-secret-key-2024",
        {
          expiresIn: -1,
        }
      );

      const decoded = verifyToken(expiredToken);

      expect(decoded).toEqual({
        error: "Token Expired",
      });
    });
  });
});
