import bcrypt from "bcryptjs";
import { AppError } from "../utils/app-error";
import { userRepository } from "../repositories/user.repository";

import { generateToken } from "../utils/jwt";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  name?: string;
  phone?: string | null;
}

export class AuthService {
  async register(data: RegisterData) {
    const email = data.email.trim().toLowerCase();

    // check existing user
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("User already exists!", 409);
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // create user
    const user = await userRepository.createUser({
      name: data.name,
      email,
      password: hashedPassword,
      phone: data.phone ?? null,
    });

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  }

  async login(data: LoginData) {
    const email = data.email.trim().toLowerCase();

    // Find User
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password!", 401);
    }

    if (!user.password) {
      throw new AppError(
        "Password is not set for this account. Please sign in with Google.",
        400,
      );
    }

    // verify password
    const passwordValid = await bcrypt.compare(data.password, user.password);

    if (!passwordValid) {
      throw new AppError("Invalid email or password!", 401);
    }

    // Generate JWT Token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  //   get current users Profile
  async getCurrentProfile(userId: number) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found!", 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.createdAt,
      account: {
        hasPassword: Boolean(user.password),
        hasGoogle: Boolean(user.firebaseUid),
        phoneAdded: Boolean(user.phone),
      },
    };
  }

  // Update current user's profile
  async updateProfile(userId: number, data: UpdateProfileData) {
    // Check whether the user exists
    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found!", 404);
    }

    // Check phone uniqueness when a new phone is supplied
    if (data.phone) {
      const phoneOwner = await userRepository.findByPhone(data.phone);

      if (phoneOwner && phoneOwner.id !== userId) {
        throw new AppError(
          "This phone number is already associated with another account!",
          409,
        );
      }
    }

    // Update profile
    const updatedUser = await userRepository.updateProfile(userId, data);

    if (!updatedUser) {
      throw new AppError("Unable to update profile!", 500);
    }

    return updatedUser;
  }

  
  // Set password for an account that does not have one
  async setPassword(
    userId: number,
    newPassword: string,
  ) {
    // Find the authenticated user
    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found!", 404);
    }

    // Email is required for email/password login
    if (!existingUser.email) {
      throw new AppError(
        "An email address is required before setting a password.",
        400,
      );
    }

    // Prevent replacing an existing password
    if (existingUser.password) {
      throw new AppError(
        "Password already exists. Please use the change password option.",
        409,
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update only if password is still NULL
    const updatedUser = await userRepository.setPasswordIfNotExists(
      userId,
      hashedPassword,
    );

    if (!updatedUser) {
      throw new AppError(
        "Password has already been set. Please use the change password option.",
        409,
      );
    }

    return updatedUser;
  }

  async changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found!", 404);
  }

  // Google-only accounts should use Set Password first.
  if (!user.password) {
    throw new AppError(
      "Password is not set for this account. Please use Set Password first.",
      409,
    );
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect!", 400);
  }

  // Additional protection against reusing the existing password.
  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.password,
  );

  if (isSamePassword) {
    throw new AppError(
      "New password must be different from your current password!",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await userRepository.updatePasswordIfCurrent(
    userId,
    user.password,
    hashedPassword,
  );

  if (!updatedUser) {
    throw new AppError(
      "Password was changed by another request. Please try again.",
      409,
    );
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    updatedAt: updatedUser.updatedAt,
  };
}

}

export const authService = new AuthService();
