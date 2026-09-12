import { Request, Response } from "express";

import { authService } from "../services/auth.service";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email and password are Required!",
        });
      }

      const result = await authService.register({
        name,
        email,
        password,
        phone,
      });

      return res.status(201).json({
        success: true,
        message: "User Registered Successfully.",
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
          },
          token: result.token,
        },
      });
    } catch (error) {
      console.error("Register Error: ", error);

      if (error instanceof Error && error.message === "User already Exists!") {
        return res.status(409).json({
          success: false,
          message: "User already Exists!",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required!",
        });
      }

      const result = await authService.login({
        email,
        password,
      });

      return res.status(200).json({
        success: true,
        message: "Login Successfull",
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
          },
          token: result.token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      if (
        error instanceof Error &&
        error.message === "Invalid Email or Password!"
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid Email or Password!",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  }

  //   get Profile
  async profile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!",
        });
      }

      const user = await authService.getCurrentProfile(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  }
}

export const authController = new AuthController();
