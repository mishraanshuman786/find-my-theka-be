
import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../../src/app";
import { cleanDatabase } from "../../helpers/db";
import { verifyToken } from "../../../src/utils/jwt";

describe("POST /api/v1/auth/login", () => {
  const user = {
    name: "Test User",
    email: "test@example.com",
    password: "Password@123",
    phone: "9876543210",
  };

  beforeEach(async () => {
    await cleanDatabase();

    // Create a user using the real registration API
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(user);

    expect(response.status).toBe(201);
  });

  it("should login with valid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Login Successfull",
      data: {
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
    });

    expect(response.body.data.user.id).toBeTypeOf("number");
    expect(response.body.data.token).toBeTypeOf("string");
  });

  it("should reject login with an incorrect password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: "WrongPassword@123",
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Email or Password!",
    });
  });

  it("should reject login with an unknown email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "unknown@example.com",
        password: user.password,
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Email or Password!",
    });
  });

  it("should reject login when email is missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        password: user.password,
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Email and password are required!",
    });
  });

  it("should reject login when password is missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Email and password are required!",
    });
  });

  it("should normalize email during login", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "  TEST@EXAMPLE.COM  ",
        password: user.password,
      });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          email: user.email,
        },
      },
    });

    expect(response.body.data.token).toBeTypeOf("string");
  });

  it("should not return the password in the login response", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.status).toBe(200);

    expect(response.body.data.user).not.toHaveProperty(
      "password"
    );

    expect(response.body.data.user.password).toBeUndefined();
  });

  it("should return a valid JWT token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.status).toBe(200);

    const token = response.body.data.token;

    expect(token).toBeTypeOf("string");

    const payload = verifyToken(token);

    expect(payload).not.toHaveProperty("error");

    expect(payload).toMatchObject({
      userId: response.body.data.user.id,
      email: user.email,
      name: user.name,
    });
  });

  it("should contain the correct user ID in the JWT", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.status).toBe(200);

    const token = response.body.data.token;

    const payload = verifyToken(token);

    expect(payload).not.toHaveProperty("error");

    if ("error" in payload) {
      throw new Error(`JWT verification failed: ${payload.error}`);
    }

    expect(payload.userId).toBe(response.body.data.user.id);
  });

  it("should contain the correct email in the JWT", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.status).toBe(200);

    const token = response.body.data.token;

    const payload = verifyToken(token);

    expect(payload).not.toHaveProperty("error");

    if ("error" in payload) {
      throw new Error(`JWT verification failed: ${payload.error}`);
    }

    expect(payload.email).toBe(user.email);
  });

  it("should contain the correct name in the JWT", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: user.email,
        password: user.password,
      });

    expect(response.status).toBe(200);

    const token = response.body.data.token;

    const payload = verifyToken(token);

    expect(payload).not.toHaveProperty("error");

    if ("error" in payload) {
      throw new Error(`JWT verification failed: ${payload.error}`);
    }

    expect(payload.name).toBe(user.name);
  });
});

