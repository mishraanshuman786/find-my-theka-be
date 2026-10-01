import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";

import { AuthController } from "../../../src/controllers/auth.controller";
import { firebaseAuthService } from "../../../src/services/firebase-auth.service";

vi.mock("../../../src/services/firebase-auth.service", () => ({
  firebaseAuthService: {
    authenticate: vi.fn(),
  },
}));

describe("AuthController - Firebase Authentication", () => {
  let controller: AuthController;

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    controller = new AuthController();

    req = {
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("should authenticate a Firebase user successfully", async () => {
    req.body = {
      idToken: "valid-firebase-id-token",
    };

    vi.mocked(firebaseAuthService.authenticate).mockResolvedValue({
      user: {
        id: 1,
        name: "Google User",
        email: "google@example.com",
        password: null,
        phone: null,
        firebaseUid: "firebase-uid-123",
        createdAt: new Date().toISOString(),
      },
      token: "find-my-theka-jwt",
    });

    await controller.firebaseLogin(
      req as Request,
      res as Response
    );

    expect(
      firebaseAuthService.authenticate
    ).toHaveBeenCalledWith(
      "valid-firebase-id-token"
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Firebase authentication successful",
      data: {
        user: {
          id: 1,
          name: "Google User",
          email: "google@example.com",
          phone: null,
        },
        token: "find-my-theka-jwt",
      },
    });
  });

  it("should return 400 when Firebase ID token is missing", async () => {
    req.body = {};

    await controller.firebaseLogin(
      req as Request,
      res as Response
    );

    expect(
      firebaseAuthService.authenticate
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Firebase ID token is required",
    });
  });

  it("should return 401 when Firebase ID token is invalid", async () => {
    req.body = {
      idToken: "invalid-firebase-id-token",
    };

    vi.mocked(firebaseAuthService.authenticate).mockRejectedValue(
      new Error("Firebase ID token is invalid")
    );

    await controller.firebaseLogin(
      req as Request,
      res as Response
    );

    expect(
      firebaseAuthService.authenticate
    ).toHaveBeenCalledWith(
      "invalid-firebase-id-token"
    );

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Firebase authentication",
    });
  });

  it("should return 409 when Firebase email and phone belong to different accounts", async () => {
    req.body = {
      idToken: "firebase-conflict-token",
    };

    vi.mocked(firebaseAuthService.authenticate).mockRejectedValue(
      new Error(
        "Firebase email and phone belong to different accounts"
      )
    );

    await controller.firebaseLogin(
      req as Request,
      res as Response
    );

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "Firebase email and phone belong to different accounts",
    });
  });
});

