import bcrypt from "bcryptjs";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AuthService } from "../../../src/services/auth.service";
import { userRepository } from "../../../src/repositories/user.repository";
import { generateToken } from "../../../src/utils/jwt";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(
      async (
        _password: string,
        _saltRounds: number
      ): Promise<string> => {
        return "$2b$10$new-hashed-password";
      }
    ),

    compare: vi.fn(
      async (
        _password: string,
        _hash: string
      ): Promise<boolean> => {
        return true;
      }
    ),
  },
}));

vi.mock("../../../src/repositories/user.repository", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    createUser: vi.fn(),
    findById: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock("../../../src/utils/jwt", () => ({
  generateToken: vi.fn(),
}));

describe("AuthService", () => {
  let authService: AuthService;

  const user = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: "$2b$10$hashed-password",
    phone: "9876543210",
    createdAt: "2026-09-21T10:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    authService = new AuthService();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        undefined
      );

      vi.mocked(bcrypt.hash).mockImplementation(
        async () => "$2b$10$new-hashed-password"
      );

      vi.mocked(userRepository.createUser).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        createdAt: "2026-09-21T10:00:00.000Z",
      });

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      const result = await authService.register({
        name: "Test User",
        email: "  TEST@EXAMPLE.COM  ",
        password: "Password@123",
        phone: "9876543210",
      });

      expect(result).toEqual({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
          createdAt: "2026-09-21T10:00:00.000Z",
        },
        token: "mock-jwt-token",
      });
    });

    it("should normalize email before checking for an existing user", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        undefined
      );

      vi.mocked(bcrypt.hash).mockImplementation(
        async () => "$2b$10$new-hashed-password"
      );

      vi.mocked(userRepository.createUser).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: null,
        createdAt: "2026-09-21T10:00:00.000Z",
      });

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.register({
        name: "Test User",
        email: "  TEST@EXAMPLE.COM  ",
        password: "Password@123",
      });

      expect(
        userRepository.findByEmail
      ).toHaveBeenCalledWith("test@example.com");
    });

    it("should reject registration when the email already exists", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      await expect(
        authService.register({
          name: "Another User",
          email: "test@example.com",
          password: "Password@123",
        })
      ).rejects.toThrow("User already Exists!");

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.createUser).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });

    it("should hash the password before creating the user", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        undefined
      );

      vi.mocked(bcrypt.hash).mockImplementation(
        async () => "$2b$10$new-hashed-password"
      );

      vi.mocked(userRepository.createUser).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: null,
        createdAt: "2026-09-21T10:00:00.000Z",
      });

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.register({
        name: "Test User",
        email: "test@example.com",
        password: "Password@123",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "Password@123",
        10
      );
    });

    it("should create the user with the hashed password", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        undefined
      );

      vi.mocked(bcrypt.hash).mockImplementation(
        async () => "$2b$10$new-hashed-password"
      );

      vi.mocked(userRepository.createUser).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: null,
        createdAt: "2026-09-21T10:00:00.000Z",
      });

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.register({
        name: "Test User",
        email: "test@example.com",
        password: "Password@123",
      });

      expect(userRepository.createUser).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "$2b$10$new-hashed-password",
        phone: null,
      });
    });

    it("should generate a JWT after successful registration", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        undefined
      );

      vi.mocked(bcrypt.hash).mockImplementation(
        async () => "$2b$10$new-hashed-password"
      );

      vi.mocked(userRepository.createUser).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        createdAt: "2026-09-21T10:00:00.000Z",
      });

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.register({
        name: "Test User",
        email: "test@example.com",
        password: "Password@123",
        phone: "9876543210",
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      vi.mocked(bcrypt.compare).mockImplementation(
        async () => true
      );

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      const result = await authService.login({
        email: "test@example.com",
        password: "Password@123",
      });

      expect(result).toEqual({
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
          createdAt: "2026-09-21T10:00:00.000Z",
        },
        token: "mock-jwt-token",
      });
    });

    it("should normalize email before looking up the user", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      vi.mocked(bcrypt.compare).mockImplementation(
        async () => true
      );

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.login({
        email: "  TEST@EXAMPLE.COM  ",
        password: "Password@123",
      });

      expect(
        userRepository.findByEmail
      ).toHaveBeenCalledWith("test@example.com");
    });

    it("should reject login when the user does not exist", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        undefined
      );

      await expect(
        authService.login({
          email: "unknown@example.com",
          password: "Password@123",
        })
      ).rejects.toThrow("Invalid Email or Password!");

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });

    it("should reject login when the password is incorrect", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      vi.mocked(bcrypt.compare).mockImplementation(
        async () => false
      );

      await expect(
        authService.login({
          email: "test@example.com",
          password: "WrongPassword@123",
        })
      ).rejects.toThrow("Invalid Email or Password!");

      expect(generateToken).not.toHaveBeenCalled();
    });

    it("should compare the provided password with the stored hash", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      vi.mocked(bcrypt.compare).mockImplementation(
        async () => true
      );

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.login({
        email: "test@example.com",
        password: "Password@123",
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "Password@123",
        user.password
      );
    });

    it("should generate a JWT after successful login", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      vi.mocked(bcrypt.compare).mockImplementation(
        async () => true
      );

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      await authService.login({
        email: "test@example.com",
        password: "Password@123",
      });

      expect(generateToken).toHaveBeenCalledWith({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    });

    it("should not expose the password in the returned user", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(
        user
      );

      vi.mocked(bcrypt.compare).mockImplementation(
        async () => true
      );

      vi.mocked(generateToken).mockReturnValue(
        "mock-jwt-token"
      );

      const result = await authService.login({
        email: "test@example.com",
        password: "Password@123",
      });

      expect(result.user).not.toHaveProperty("password");
    });
  });

  describe("getCurrentProfile", () => {
    
it("should return the user's profile", async () => {
  vi.mocked(userRepository.findById).mockResolvedValue({
    id: 1,
    name: "Test User",
    email: "test@example.com",
    phone: "9876543210",
    createdAt: "2026-09-21T10:00:00.000Z",
  });

  const result = await authService.getCurrentProfile(1);

  expect(result).toEqual({
    id: 1,
    name: "Test User",
    email: "test@example.com",
    phone: "9876543210",
    created_at: "2026-09-21T10:00:00.000Z",
  });
});


    it("should query the repository using the authenticated user ID", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        createdAt: "2026-09-21T10:00:00.000Z",
      });

      await authService.getCurrentProfile(1);

      expect(
        userRepository.findById
      ).toHaveBeenCalledWith(1);
    });

    it("should throw when the user does not exist", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(
        undefined
      );

      await expect(
        authService.getCurrentProfile(999)
      ).rejects.toThrow("User Not Found!");
    });
  });
});

