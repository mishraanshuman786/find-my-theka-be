import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../../src/app";

import { cleanDatabase } from "../../helpers/db";

describe("POST /api/v1/thekas", () => {
  const user = {
    name: "Theka Owner",
    email: "theka-owner@example.com",
    password: "Password@123",
    phone: "9876543210",
  };

  const theka = {
    name: "Sharma Wine Shop",
    contactPhone: "9123456789",
    address: "Main Road, Near Lanka Crossing",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pincode: "221001",
    latitude: 25.4358,
    longitude: 82.8534,
    aadhaarNumber: "123456789012",
    gstNumber: "09ABCDE1234F1Z5",
    licenseNumber: "UP-EXC-123456",
  };

  let token: string;
  let userId: number;

  beforeEach(async () => {
    await cleanDatabase();

    // Create a real user using the registration API
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(user);

    expect(response.status).toBe(201);

    token = response.body.data.token;
    userId = response.body.data.user.id;
  });

  it("should register a theka successfully for an authenticated user", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send(theka);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      message: "Theka registration submitted successfully",
      data: {
        ownerUserId: userId,
        name: theka.name,
        contactPhone: theka.contactPhone,
        address: theka.address,
        city: theka.city,
        state: theka.state,
        pincode: theka.pincode,
        aadhaarNumber: theka.aadhaarNumber,
        gstNumber: theka.gstNumber,
        licenseNumber: theka.licenseNumber,
        status: "PENDING",
      },
    });

    expect(response.body.data.id).toBeTypeOf("number");
  });

  it("should use the authenticated user's ID as the owner", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        ownerUserId: 999999,
      });

    expect(response.status).toBe(201);

    expect(response.body.data.ownerUserId).toBe(userId);
    expect(response.body.data.ownerUserId).not.toBe(999999);
  });

  it("should create theka with PENDING status", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send(theka);

    expect(response.status).toBe(201);

    expect(response.body.data.status).toBe("PENDING");
  });

  it("should reject theka registration without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .send(theka);

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Access Denied. No Token Provided!",
    });
  });

  it("should reject theka registration with an invalid token", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", "Bearer invalid-token")
      .send(theka);

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid theka data", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        name: "",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });

    expect(response.body.error).toBeTypeOf("object");
  });

  it("should reject registration when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });

    expect(response.body.error).toBeTypeOf("object");
  });

  it("should reject an invalid contact phone number", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        contactPhone: "1234567890",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });
  });

  it("should reject an invalid pincode", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        pincode: "22100",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });
  });

  it("should reject invalid coordinates", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        latitude: 100,
        longitude: 200,
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });
  });

  it("should reject an invalid GST number", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        gstNumber: "INVALID-GST",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });
  });

  it("should reject an invalid Aadhaar number", async () => {
    const response = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...theka,
        aadhaarNumber: "12345",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid Theka Registration Data!",
    });
  });
});