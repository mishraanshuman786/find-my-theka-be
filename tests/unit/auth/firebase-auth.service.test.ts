import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateToken } from "../../../src/utils/jwt";
import {
  firebaseAuthService,
  FirebaseAuthService,
} from "../../../src/services/firebase-auth.service";

const { verifyIdTokenMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
}));

vi.mock("../../../src/config/firebase", () => ({
  getFirebaseAuth: () => ({
    verifyIdToken: verifyIdTokenMock,
  }),
}));

// mocking the generate Token
vi.mock("../../../src/utils/jwt", () => ({
  generateToken: vi.fn(),
}));

describe("FirebaseAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an existing local user when Firebase UID is already linked", async () => {
    const decodedToken = {
      uid: "firebase-uid-123",
      email: "anshuman@example.com",
      email_verified: true,
      name: "Anshuman Mishra",
    };

    const existingUser = {
      id: 1,
      name: "Anshuman Mishra",
      email: "anshuman@example.com",
      password: "hashed-password",
      phone: null,
      firebaseUid: "firebase-uid-123",
      createdAt: "2026-09-24T10:00:00.000Z",
    };

    verifyIdTokenMock.mockResolvedValue(decodedToken as any);

    const userRepository = {
      findByFirebaseUid: vi.fn().mockResolvedValue(existingUser),
    };

    const service = new FirebaseAuthService(userRepository as any);

    const result = await service.authenticate("valid-firebase-id-token");

    expect(userRepository.findByFirebaseUid).toHaveBeenCalledWith(
      "firebase-uid-123",
    );

    expect(result.user).toEqual(existingUser);
  });

  it("should link Firebase UID to an existing verified email account", async () => {
    const decodedToken = {
      uid: "firebase-uid-456",
      email: "existing@example.com",
      email_verified: true,
      name: "Existing User",
    };

    const existingUser = {
      id: 2,
      name: "Existing User",
      email: "existing@example.com",
      password: "hashed-password",
      phone: null,
      firebaseUid: null,
      createdAt: "2026-09-24T10:00:00.000Z",
    };

    const linkedUser = {
      ...existingUser,
      firebaseUid: "firebase-uid-456",
    };

    verifyIdTokenMock.mockResolvedValue(decodedToken as any);

    const userRepository = {
      findByFirebaseUid: vi.fn().mockResolvedValue(undefined),
      findByEmail: vi.fn().mockResolvedValue(existingUser),
      updateFirebaseUid: vi.fn().mockResolvedValue(linkedUser),
    };

    const service = new FirebaseAuthService(userRepository as any);

    const result = await service.authenticate("valid-firebase-id-token");

    expect(userRepository.findByFirebaseUid).toHaveBeenCalledWith(
      "firebase-uid-456",
    );

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      "existing@example.com",
    );

    expect(userRepository.updateFirebaseUid).toHaveBeenCalledWith(
      2,
      "firebase-uid-456",
    );

    expect(result.user).toEqual(linkedUser);
  });

  it("should not link an existing account when Firebase email is not verified", async () => {
    const decodedToken = {
      uid: "firebase-uid-789",
      email: "existing@example.com",
      email_verified: false,
      name: "Existing User",
    };

    verifyIdTokenMock.mockResolvedValue(decodedToken as any);

    const userRepository = {
      findByFirebaseUid: vi.fn().mockResolvedValue(undefined),
      findByEmail: vi.fn(),
      updateFirebaseUid: vi.fn(),
      createUser: vi.fn(),
    };

    const service = new FirebaseAuthService(userRepository as any);

    await expect(
      service.authenticate("firebase-token-unverified-email"),
    ).rejects.toThrow("Firebase account has no verified email");

    expect(userRepository.findByFirebaseUid).toHaveBeenCalledWith(
      "firebase-uid-789",
    );

    expect(userRepository.findByEmail).not.toHaveBeenCalled();

    expect(userRepository.updateFirebaseUid).not.toHaveBeenCalled();

    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it("should create a new local user for a verified Google Firebase account", async () => {
    const decodedToken = {
      uid: "firebase-google-new",
      email: "newgoogle@example.com",
      email_verified: true,
      name: "Google User",
    };

    verifyIdTokenMock.mockResolvedValue(decodedToken as any);

    const userRepo = {
      findByFirebaseUid: vi.fn().mockResolvedValue(undefined),
      findByEmail: vi.fn().mockResolvedValue(undefined),

      updateFirebaseUid: vi.fn(),
      createUser: vi.fn().mockResolvedValue({
        id: 10,
        name: "Google User",
        email: "newgoogle@example.com",
        password: null,
        phone: null,
        firebaseUid: "firebase-google-new",
        createdAt: new Date().toISOString(),
      }),
    };

    const service = new FirebaseAuthService(userRepo);

    const result = await service.authenticate("valid-google-firebase-token");
    expect(userRepo.findByFirebaseUid).toHaveBeenCalledWith(
      "firebase-google-new",
    );

    expect(userRepo.findByEmail).toHaveBeenCalledWith("newgoogle@example.com");
    expect(userRepo.createUser).toHaveBeenCalledWith({
      name: "Google User",
      email: "newgoogle@example.com",
      password: null,
      phone: null,
      firebaseUid: "firebase-google-new",
    });
    expect(result.user).toEqual({
      id: 10,
      name: "Google User",
      email: "newgoogle@example.com",
      password: null,
      phone: null,
      firebaseUid: "firebase-google-new",
      createdAt: expect.any(String),
    });
  });

  it("should return a Find My Theka JWT after Firebase authentication", async () => {
    const decodedToken = {
      uid: "firebase-google-jwt-test",
      email: "jwtuser@example.com",
      email_verified: true,
      name: "JWT User",
    };
    verifyIdTokenMock.mockResolvedValue(decodedToken as any);
    vi.mocked(generateToken).mockReturnValue("find-my-theka-jwt-token");
    const existingUser = {
      id: 40,
      name: "JWT User",
      email: "jwtuser@example.com",
      password: null,
      phone: null,
      firebaseUid: "firebase-google-jwt-test",
      createdAt: new Date().toISOString(),
    };
    const userRepository = {
      findByFirebaseUid: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn(),
      updateFirebaseUid: vi.fn(),
      createUser: vi.fn(),
    };
    const service = new FirebaseAuthService(userRepository as any);
    const result = await service.authenticate("firebase-jwt-test-token");
    expect(generateToken).toHaveBeenCalledWith({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    });
    expect(result).toEqual({
      user: existingUser,
      token: "find-my-theka-jwt-token",
    });
  });

  it("should use verified email authentication even when Firebase provides a phone number", async () => {
    const decodedToken = {
      uid: "firebase-google-with-phone",
      email: "user@example.com",
      email_verified: true,
      phone_number: "+919876543210",
      name: "Google User",
    };

    verifyIdTokenMock.mockResolvedValue(decodedToken as any);

    const existingUser = {
      id: 50,
      name: "Existing User",
      email: "user@example.com",
      password: null,
      phone: "9876543210",
      firebaseUid: null,
      createdAt: new Date().toISOString(),
    };

    const linkedUser = {
      ...existingUser,
      firebaseUid: "firebase-google-with-phone",
    };

    const userRepository = {
      findByFirebaseUid: vi.fn().mockResolvedValue(undefined),
      findByEmail: vi.fn().mockResolvedValue(existingUser),
      updateFirebaseUid: vi.fn().mockResolvedValue(linkedUser),
      createUser: vi.fn(),
    };

    const service = new FirebaseAuthService(userRepository as any);

    const result = await service.authenticate(
      "firebase-google-with-phone-token",
    );

    expect(userRepository.findByEmail).toHaveBeenCalledWith("user@example.com");

    expect(userRepository.updateFirebaseUid).toHaveBeenCalledWith(
      50,
      "firebase-google-with-phone",
    );

    expect(userRepository.createUser).not.toHaveBeenCalled();

    expect(result.user).toEqual(linkedUser);
  });
});
