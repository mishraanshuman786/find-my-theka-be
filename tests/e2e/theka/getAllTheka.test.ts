import request from "supertest";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../../src/app";
import { cleanDatabase } from "../../helpers/db";

describe("GET /api/v1/thekas", () => {
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

  it("should return authenticated user's thekas", async () => {
    // Create first theka
    await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send(theka);

    // Create second theka
    await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send(secondTheka);

    const response = await request(app)
      .get("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: theka.name,
          contactPhone: theka.contactPhone,
          status: "PENDING",
        }),
        expect.objectContaining({
          name: secondTheka.name,
          contactPhone: secondTheka.contactPhone,
          status: "PENDING",
        }),
      ]),
    );
  });

  it("should return an empty array when user has no thekas", async () => {
    const response = await request(app)
      .get("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      data: [],
    });
  });

  it("should return only the authenticated user's thekas", async () => {
    // Create theka for first user
    const firstUserThekaResponse = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`)
      .send(theka);

    expect(firstUserThekaResponse.status).toBe(201);

    // Create second user
    const secondUserResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(secondUser);

    expect(secondUserResponse.status).toBe(201);

    const secondToken = secondUserResponse.body.data.token;

    // Create theka for second user
    const secondUserThekaResponse = await request(app)
      .post("/api/v1/thekas")
      .set("Authorization", `Bearer ${secondToken}`)
      .send(secondTheka);

    expect(secondUserThekaResponse.status).toBe(201);

    // Request as first user
    const response = await request(app)
      .get("/api/v1/thekas")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0].name).toBe(theka.name);

    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: secondTheka.name,
        }),
      ]),
    );
  });

  it("should reject request without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/thekas");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Access Denied. No Token Provided!",
    });
  });

  it("should reject request with an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/thekas")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });
});