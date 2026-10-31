import type { Request, Response } from "express";

import { authService } from "../services/auth.service";
import { firebaseAuthService } from "../services/firebase-auth.service";
import { AppError } from "../utils/app-error";
import {
  updateProfileSchema,
  setPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validation";

export class AuthController {
  async register(req: Request, res: Response) {
    const { name, email, password, phone } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      throw new AppError("Name, email and password are required!", 400);
    }

    const result = await authService.register({
      name,
      email,
      password,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
        },
        token: result.token,
      },
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      throw new AppError("Email and password are required!", 400);
    }

    const result = await authService.login({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
        },
        token: result.token,
      },
    });
  }

  // Login using Firebase with email or phone.
  async firebaseLogin(req: Request, res: Response) {
    const { idToken } = req.body;

    if (typeof idToken !== "string" || !idToken.trim()) {
      throw new AppError("Firebase ID token is required", 400);
    }

    const result = await firebaseAuthService.authenticate(idToken);

    return res.status(200).json({
      success: true,
      message: "Firebase authentication successful",
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
        },
        token: result.token,
      },
    });
  }

  // Get current user's profile.
  async profile(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    const user = await authService.getCurrentProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  }

  // Update current user's profile
  async updateProfile(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        validationResult.error.issues[0]?.message || "Invalid profile data!",
        400,
      );
    }

    const updatedUser = await authService.updateProfile(
      req.user.userId,
      validationResult.data,
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser,
    });
  }

  // Set password for the current authenticated user
  async setPassword(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    const validationResult = setPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        validationResult.error.issues[0]?.message || "Invalid password!",
        400,
      );
    }

    const user = await authService.setPassword(
      req.user.userId,
      validationResult.data.newPassword,
    );

    return res.status(200).json({
      success: true,
      message:
        "Password set successfully. You can now log in using your email and password.",
      data: {
        id: user.id,
        email: user.email,
        hasPassword: true,
      },
    });
  }

  async changePassword(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized!", 401);
    }

    const validation = changePasswordSchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        validation.error.issues[0]?.message || "Invalid request data",
        400,
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const userId = req.user.userId;

    await authService.changePassword(userId, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  }
}

export const authController = new AuthController();
