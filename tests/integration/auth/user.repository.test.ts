import { beforeEach, describe, expect, it } from "vitest";

import { userRepository } from "../../../src/repositories/user.repository";

import { cleanDatabase } from "../../helpers/db";

describe("UserRepository Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("createUser", () => {
    it("should create a new user in the database", async () => {
      const user = await userRepository.createUser({
        name: "Test User",
        email: "test@example.com",
        password: "$2b$10$hashedpassword",
        phone: "9876543210",
      });

      expect(user).toBeDefined();
      expect(user.id).toBeTypeOf("number");
      expect(user.name).toBe("Test User");
      expect(user.email).toBe("test@example.com");
      expect(user.phone).toBe("9876543210");
      expect(user.createdAt).toBeDefined();
    });

    it("should persist the user in the database", async () => {
      const createdUser = await userRepository.createUser({
        name: "Persisted User",
        email: "persisted@example.com",
        password: "$2b$10$hashedpassword",
        phone: "9876543210",
      });

      const user = await userRepository.findByEmail("persisted@example.com");

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.name).toBe("Persisted User");
      expect(user?.email).toBe("persisted@example.com");
    });
    it("should allow phone to be null", async () => {
      const user = await userRepository.createUser({
        name: "No Phone User",
        email: "nophone@example.com",
        password: "$2b$10$hashedpassword",
        phone: null,
      });

      expect(user.phone).toBeNull();
    });

    it("should reject duplicate email addresses", async () => {
      await userRepository.createUser({
        name: "First User",
        email: "duplicate@example.com",
        password: "$2b$10$hashedpassword",
      });

      await expect(
        userRepository.createUser({
          name: "Second User",
          email: "duplicate@example.com",
          password: "$2b$10$hashedpassword",
        }),
      ).rejects.toThrow();
    });
  });

  describe("findByEmail", () => {
    it("should return a user by email", async () => {
      await userRepository.createUser({
        name: "Email User",
        email: "email@example.com",
        password: "$2b$10$hashedpassword",
        phone: "9876543210",
      });

      const user = await userRepository.findByEmail("email@example.com");

      expect(user).toBeDefined();
      expect(user?.name).toBe("Email User");
      expect(user?.email).toBe("email@example.com");
      expect(user?.phone).toBe("9876543210");
    });

    it("should return the password hash when finding a user by email", async () => {
      await userRepository.createUser({
        name: "Password User",
        email: "password@example.com",
        password: "$2b$10$hashedpassword",
      });

      const user = await userRepository.findByEmail("password@example.com");

      expect(user?.password).toBe("$2b$10$hashedpassword");
    });

    it("should return undefined when email does not exist", async () => {
      const user = await userRepository.findByEmail("missing@example.com");

      expect(user).toBeUndefined();
    });
  });

  describe("findById", () => {
    it("should return a user by ID", async () => {
      const createdUser = await userRepository.createUser({
        name: "ID User",
        email: "id@example.com",
        password: "$2b$10$hashedpassword",
        phone: "9876543210",
      });

      const user = await userRepository.findById(createdUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.name).toBe("ID User");
      expect(user?.email).toBe("id@example.com");
    });

    it("should return undefined when user ID does not exist", async () => {
      const user = await userRepository.findById(999999);

      expect(user).toBeUndefined();
    });
  });

  describe("updatePassword", () => {
    it("should update the user's password", async () => {
      const createdUser = await userRepository.createUser({
        name: "Password Update User",
        email: "update@example.com",
        password: "$2b$10$oldpassword",
      });

      const updatedUser = await userRepository.updatePassword(
        createdUser.id,
        "$2b$10$newpassword",
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.password).toBe("$2b$10$newpassword");
    });

    it("should persist the updated password in the database", async () => {
      const createdUser = await userRepository.createUser({
        name: "Persist Password User",
        email: "persist-password@example.com",
        password: "$2b$10$oldpassword",
      });

      await userRepository.updatePassword(createdUser.id, "$2b$10$newpassword");

      const user = await userRepository.findByEmail(
        "persist-password@example.com",
      );

      expect(user?.password).toBe("$2b$10$newpassword");
    });

    it("should return undefined when updating a non-existing user", async () => {
      const result = await userRepository.updatePassword(
        999999,
        "$2b$10$newpassword",
      );

      expect(result).toBeUndefined();
    });
  });
});
