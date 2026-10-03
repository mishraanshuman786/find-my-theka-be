import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import app from "../../../src/app";

import { db } from "../../../src/db";
import { users } from "../../../src/db/schema";
import { cleanDatabase } from "../../helpers/db";

const { verifyIdTokenMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
}));

vi.mock("../../../src/config/firebase", () => ({
  getFirebaseAuth: () => ({
    verifyIdToken: verifyIdTokenMock,
  }),
}));

describe("POST /api/v1/auth/firebase", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanDatabase();
  });

  it("should return 400 when Firebase ID token is missing", async () => {
    const response = await request(app).post("/api/v1/auth/firebase").send({});

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Firebase ID token is required",
    });

    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it("should return 401 when Firebase ID token is invalid", async () => {
    verifyIdTokenMock.mockRejectedValue(
      new Error("Firebase ID token is invalid"),
    );

    const response = await request(app).post("/api/v1/auth/firebase").send({
      idToken: "invalid-firebase-token",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid Firebase authentication",
    });

    expect(verifyIdTokenMock).toHaveBeenCalledWith("invalid-firebase-token");
  });

  it("should login an existing Firebase user", async () => {
    const [existingUser] = await db
      .insert(users)
      .values({
        name: "Existing Firebase User",
        email: "firebase@example.com",
        password: null,
        phone: null,
        firebaseUid: "firebase-existing-uid",
      })
      .returning();

    verifyIdTokenMock.mockResolvedValue({
      uid: "firebase-existing-uid",
      email: "firebase@example.com",
      email_verified: true,
      name: "Existing Firebase User",
    } as any);

    const response = await request(app).post("/api/v1/auth/firebase").send({
      idToken: "valid-existing-firebase-token",
    });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Firebase authentication successful");

    expect(response.body.data.user).toEqual({
      id: existingUser.id,
      name: "Existing Firebase User",
      email: "firebase@example.com",
      phone: null,
    });

    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it("should create a new user for a verified Firebase email", async () => {
    verifyIdTokenMock.mockResolvedValue({
      uid: "firebase-new-google-uid",
      email: "newgoogle@example.com",
      email_verified: true,
      name: "New Google User",
    } as any);

    const response = await request(app).post("/api/v1/auth/firebase").send({
      idToken: "valid-new-google-token",
    });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.user).toMatchObject({
      name: "New Google User",
      email: "newgoogle@example.com",
      phone: null,
    });

    expect(response.body.data.token).toEqual(expect.any(String));

    const [createdUser] = await db.select().from(users);

    expect(createdUser).toMatchObject({
      name: "New Google User",
      email: "newgoogle@example.com",
      password: null,
      phone: null,
      firebaseUid: "firebase-new-google-uid",
    });
  });

  it("should link Firebase UID to an existing verified email user", async () => {
    const [existingUser] = await db
      .insert(users)
      .values({
        name: "Existing Email User",
        email: "existing@example.com",
        password: "hashed-password",
        phone: null,
        firebaseUid: null,
      })
      .returning();

    verifyIdTokenMock.mockResolvedValue({
      uid: "firebase-email-link-uid",
      email: "existing@example.com",
      email_verified: true,
      name: "Existing Email User",
    } as any);

    const response = await request(app).post("/api/v1/auth/firebase").send({
      idToken: "valid-email-link-token",
    });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.user).toMatchObject({
      id: existingUser.id,
      name: "Existing Email User",
      email: "existing@example.com",
      phone: null,
    });

    const [linkedUser] = await db.select().from(users);

    expect(linkedUser.firebaseUid).toBe("firebase-email-link-uid");
  });

  it("should authenticate using verified email and ignore Firebase phone number", async () => {
  const [existingUser] = await db
    .insert(users)
    .values({
      name: "Existing User",
      email: "existing@example.com",
      password: "hashed-password",
      phone: "9876543210",
      firebaseUid: null,
    })
    .returning();

  verifyIdTokenMock.mockResolvedValue({
    uid: "firebase-google-user",
    email: "existing@example.com",
    email_verified: true,
    phone_number: "+919876543210",
    name: "Existing User",
  } as any);

  const response = await request(app)
    .post("/api/v1/auth/firebase")
    .send({
      idToken: "valid-firebase-token",
    });

  expect(response.status).toBe(200);

  expect(response.body.data.user).toEqual({
    id: existingUser.id,
    name: "Existing User",
    email: "existing@example.com",
    phone: "9876543210",
  });

  const [updatedUser] = await db
    .select()
    .from(users);

  expect(updatedUser.firebaseUid).toBe(
    "firebase-google-user"
  );

  expect(updatedUser.phone).toBe(
    "9876543210"
  );
});

  it("should return 401 when Firebase account has no verified identity", async () => {
    verifyIdTokenMock.mockResolvedValue({
      uid: "firebase-no-identity-uid",
      email: "unverified@example.com",
      email_verified: false,
    } as any);

    const response = await request(app).post("/api/v1/auth/firebase").send({
      idToken: "firebase-no-identity-token",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid Firebase authentication",
    });
  });
});
