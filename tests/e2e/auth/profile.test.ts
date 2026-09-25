
import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../../src/app";
import { cleanDatabase } from "../../helpers/db";

describe("GET /api/v1/auth/profile", () => {
  const user = {
    name: "Test User",
    email: "test@example.com",
    password: "Password@123",
    phone: "9876543210",
  };

  let token: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Register the user through the real API
    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(user);

    expect(registerResponse.status).toBe(201);

    // Login through the real API to obtain a JWT
    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(loginResponse.status).toBe(200);

    token = loginResponse.body.data.token;
  });

  it("should return the authenticated user's profile", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

    expect(response.body.data.id).toBeTypeOf("number");
  });

  it("should reject profile request when no token is provided", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Access Denied. No Token Provided!",
    });
  });

  it("should reject profile request with an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set(
        "Authorization",
        "Bearer invalid-token"
      );

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Token!",
    });
  });

  it("should reject profile request with a malformed authorization header", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set(
        "Authorization",
        `Token ${token}`
      );

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Access Denied. No Token Provided!",
    });
  });

it("should reject profile request with an empty bearer token", async () => {
  const response = await request(app)
    .get("/api/v1/auth/profile")
    .set("Authorization", "Bearer ");

  expect(response.status).toBe(401);

  expect(response.body).toMatchObject({
    success: false,
    message: "Access Denied. No Token Provided!",
  });
});

  it("should not return the user's password", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.data).not.toHaveProperty(
      "password"
    );

    expect(response.body.data.password).toBeUndefined();
  });

  it("should return the correct authenticated user's data", async () => {
    const response = await request(app)
      .get("/api/v1/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  });
});

