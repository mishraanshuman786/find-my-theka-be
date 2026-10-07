import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../../src/app";
import { cleanDatabase } from "../../helpers/db";

describe("GET /api/v1/thekas/:id", () => {
  const user = {
    name: "Theka Owner",
    email: "theka-owner@example.com",
    password: "Password@123",
    phone: "9876543210",
  };

  const secondUser = {
    name: "Second Owner",
    email: "second-owner@example.com",
    password: "Password@123",
    phone: "9123456789",
  };

  const theka = {
    name: "Sharma Wine Shop",
    contactPhone: "9000000001",
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

  const secondTheka = {
    name: "Lanka Wine Shop",
    contactPhone: "9000000002",
    address: "Lanka Road",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pincode: "221005",
    latitude: 25.2677,
    longitude: 82.9913,
    aadhaarNumber: "987654321098",
    gstNumber: "09ABCDE5678G1Z5",
    licenseNumber: "UP-EXC-654321",
  };

  let token: string;

  beforeEach(async () => {
    await cleanDatabase();

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(user);

    expect(response.status).toBe(201);

    token = response.body.data.token;
  });

  it("should return theka details for the authenticated owner", async () => {
    const createResponse = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send(theka);

    expect(createResponse.status).toBe(201);

    const thekaId = createResponse.body.data.id;

    const response = await request(app)
      .get(`/api/v1/thekas/${thekaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: thekaId,
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
  });

  it("should return 404 when theka ID does not exist", async () => {
    const response = await request(app)
      .get("/api/v1/thekas/999999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Theka not found",
    });
  });

  it("should return 404 when theka exists but belongs to another user", async () => {
    // Register second user
    const secondUserResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(secondUser);

    expect(secondUserResponse.status).toBe(201);

    const secondToken = secondUserResponse.body.data.token;

    // Second user creates theka
    const createResponse = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${secondToken}`)
      .send(secondTheka);

    expect(createResponse.status).toBe(201);

    const secondThekaId = createResponse.body.data.id;

    // First user tries to access second user's theka
    const response = await request(app)
      .get(`/api/v1/thekas/${secondThekaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Theka not found",
    });

    expect(response.body.data).toBeUndefined();
  });

  it("should return 400 when theka ID is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/thekas/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid theka ID",
    });
  });

  it("should return 400 when theka ID is zero", async () => {
    const response = await request(app)
      .get("/api/v1/thekas/0")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid theka ID",
    });
  });

  it("should reject request without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/thekas/1");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Access Denied. No Token Provided!",
    });
  });

  it("should reject request with an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/thekas/1")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });
});