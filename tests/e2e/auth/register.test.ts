
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../../src/app";
import { db } from "../../../src/db";
import { users } from "../../../src/db/schema";
import { cleanDatabase } from "../../helpers/db";

describe("POST /api/v1/auth/register", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("should reject registration when email already exists", async () => {
    const user = {
      name: "Test User",
      email: "test@example.com",
      password: "Password@123",
      phone: "9876543210",
    };

    // First registration
    const firstResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(user);

    expect(firstResponse.status).toBe(201);

    // Second registration with the same email
    const secondResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...user,
        name: "Another User",
      });

    expect(secondResponse.status).toBe(409);

    expect(secondResponse.body).toMatchObject({
      success: false,
      message: "User already Exists!",
    });
  });

  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Password@123",
        phone: "9876543210",
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      message: "User Registered Successfully.",
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
        },
      },
    });

    expect(response.body.data.user.id).toBeTypeOf("number");
    expect(response.body.data.token).toBeTypeOf("string");
  });

  it("should reject registration when name is missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "test@example.com",
        password: "Password@123",
        phone: "9876543210",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Name, email and password are Required!",
    });
  });

  it("should reject registration when email is missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        password: "Password@123",
        phone: "9876543210",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Name, email and password are Required!",
    });
  });

  it("should reject registration when password is missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Name, email and password are Required!",
    });
  });

  it("should normalize email before registration", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "  TEST@Example.COM  ",
        password: "Password@123",
        phone: "9876543210",
      });

    expect(response.status).toBe(201);

    expect(response.body.data.user.email).toBe(
      "test@example.com"
    );
  });

  it("should reject duplicate email even when email casing differs", async () => {
    const firstResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "First User",
        email: "test@example.com",
        password: "Password@123",
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Second User",
        email: "  TEST@EXAMPLE.COM  ",
        password: "Password@456",
      });

    expect(secondResponse.status).toBe(409);

    expect(secondResponse.body).toMatchObject({
      success: false,
      message: "User already Exists!",
    });
  });

  it("should not return the password in the response", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Security Test User",
        email: "security@example.com",
        password: "Password@123",
      });

    expect(response.status).toBe(201);

    expect(response.body.data.user).not.toHaveProperty(
      "password"
    );

    expect(response.body.data.user.password).toBeUndefined();
  });

  it("should store the password as a bcrypt hash", async () => {
    const password = "Password@123";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Hash Test User",
        email: "hash@example.com",
        password,
      });

    expect(response.status).toBe(201);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, "hash@example.com"))
      .limit(1);

    expect(result).toHaveLength(1);

    const storedPassword = result[0].password;

    // Plain password must not be stored
    expect(storedPassword).not.toBe(password);

    // Verify bcrypt hash format
    expect(storedPassword).toMatch(/^\$2[aby]\$\d{2}\$/);

    // Verify the original password matches the stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      storedPassword
    );

    expect(passwordMatches).toBe(true);
  });
});

