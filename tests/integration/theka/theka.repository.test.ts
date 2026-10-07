import { beforeEach, expect, describe, it } from "vitest";

import { thekas } from "../../../src/db/schema";
import { users } from "../../../src/db/schema";
import { db } from "../../../src/db";
import { thekaRepository } from "../../../src/repositories/theka.repository";
import { cleanDatabase } from "../../helpers/db";

describe("ThekaRepository", () => {
  let userId: number;

  beforeEach(async () => {
    await cleanDatabase();

    //  inserting the data in the users table to test the insertion
    const [user] = await db
      .insert(users)
      .values({
        name: "Rahul Sharma",
        email: "rahul@example.com",
        password: "hashed-password",
      })
      .returning({
        id: users.id,
      });

    userId = user.id;
  });

  it("should create a theka", async () => {
    const result = await thekaRepository.create({
      ownerUserId: userId,
      name: "Sharma Wine Shop",
      contactPhone: "9876543210",
      address: "Main Road",
      city: "Varanasi",
      state: "Uttar Pradesh",
      pincode: "221001",
      latitude: "25.4358",
      longitude: "82.8534",
      aadhaarNumber: "123456789012",
      gstNumber: "09ABCDE1234F1Z5",
      licenseNumber: "UP-EXC-123456",
    });

    expect(result).toBeDefined();
    expect(result.ownerUserId).toBe(userId);
    expect(result.name).toBe("Sharma Wine Shop");
    expect(result.status).toBe("PENDING");
  });

  it("should find a theka by id", async () => {
    const created = await thekaRepository.create({
      ownerUserId: userId,
      name: "Sharma Wine Shop",
      contactPhone: "9876543210",
      address: "Main Road",
      city: "Varanasi",
      state: "Uttar Pradesh",
      pincode: "221001",
      latitude: "25.4358",
      longitude: "82.8534",
      aadhaarNumber: "123456789012",
      gstNumber: "09ABCDE1234F1Z5",
      licenseNumber: "UP-EXC-123456",
    });

    const result = await thekaRepository.findById(created.id);

    expect(result).toBeDefined();
    expect(result?.id).toBe(created.id);
    expect(result?.ownerUserId).toBe(userId);
  });

  it("should find thekas by owner user id", async () => {
    await thekaRepository.create({
      ownerUserId: userId,
      name: "Sharma Wine Shop",
      contactPhone: "9876543210",
      address: "Main Road",
      city: "Varanasi",
      state: "Uttar Pradesh",
      pincode: "221001",
      latitude: "25.4358",
      longitude: "82.8534",
      aadhaarNumber: "123456789012",
      gstNumber: "09ABCDE1234F1Z5",
      licenseNumber: "UP-EXC-123456",
    });

    const result = await thekaRepository.findByOwnerUserId(userId);

    expect(result).toHaveLength(1);
    expect(result[0].ownerUserId).toBe(userId);
  });

  it("should return undefined when theka does not exist", async () => {
    const result = await thekaRepository.findById(999999);

    expect(result).toBeUndefined();
  });

  it("should find a theka by id and owner user id", async () => {
    const created = await thekaRepository.create({
      ownerUserId: userId,
      name: "Sharma Wine Shop",
      contactPhone: "9876543210",
      address: "Main Road",
      city: "Varanasi",
      state: "Uttar Pradesh",
      pincode: "221001",
      latitude: "25.4358",
      longitude: "82.8534",
      aadhaarNumber: "123456789012",
      gstNumber: "09ABCDE1234F1Z5",
      licenseNumber: "UP-EXC-123456",
    });

    const result = await thekaRepository.findByIdAndOwnerUserId(
      created.id,
      userId,
    );

    expect(result).toBeDefined();

    expect(result?.id).toBe(created.id);

    expect(result?.ownerUserId).toBe(userId);

    expect(result?.name).toBe("Sharma Wine Shop");
  });

  it("should return undefined when theka belongs to another user", async () => {
    const [anotherUser] = await db
      .insert(users)
      .values({
        name: "Amit Kumar",
        email: "amit@example.com",
        password: "hashed-password",
      })
      .returning({
        id: users.id,
      });

    const created = await thekaRepository.create({
      ownerUserId: anotherUser.id,
      name: "Amit Wine Shop",
      contactPhone: "9123456789",
      address: "Station Road",
      city: "Varanasi",
      state: "Uttar Pradesh",
      pincode: "221002",
      latitude: "25.4360",
      longitude: "82.8540",
      aadhaarNumber: "987654321098",
      gstNumber: "09ABCDE5678G1Z5",
      licenseNumber: "UP-EXC-654321",
    });

    const result = await thekaRepository.findByIdAndOwnerUserId(
      created.id,
      userId,
    );

    expect(result).toBeUndefined();
  });

  it("should return an empty array when owner has no thekas", async () => {
    const result = await thekaRepository.findByOwnerUserId(userId);

    expect(result).toEqual([]);
  });
});
