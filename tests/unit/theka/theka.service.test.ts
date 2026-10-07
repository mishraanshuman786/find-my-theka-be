import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThekaService } from "../../../src/services/theka.service";

describe("ThekaService", () => {
  const thekaRepository = {
    create: vi.fn(),
    findByOwnerUserId: vi.fn(),
    findByIdAndOwnerUserId: vi.fn(),
  };

  let thekaService: ThekaService;

  const userId = 1;

  const validThekaData = {
    name: "Sharma Wine Shop",
    contactPhone: "9876543210",
    address: "Main Road",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pincode: "221001",
    latitude: 25.4358,
    longitude: 82.8534,
    aadhaarNumber: "123456789012",
    gstNumber: "09ABCDE1234F1Z5",
    licenseNumber: "UP-EXC-123456",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    thekaService = new ThekaService(
      thekaRepository as any,
    );
  });

  // -------------------------------------------------------
  // CREATE THEKA
  // -------------------------------------------------------

  it("should create a theka for the authenticated user", async () => {
    const createdTheka = {
      id: 1,
      ownerUserId: userId,
      ...validThekaData,
      latitude: "25.4358000",
      longitude: "82.8534000",
      status: "PENDING",
    };

    thekaRepository.create.mockResolvedValue(createdTheka);

    const result = await thekaService.createTheka(
      userId,
      validThekaData,
    );

    expect(result).toEqual(createdTheka);

    expect(
      thekaRepository.create,
    ).toHaveBeenCalledTimes(1);
  });

  it("should use the authenticated user id as ownerUserId", async () => {
    const createdTheka = {
      id: 1,
      ownerUserId: userId,
      ...validThekaData,
      latitude: "25.4358000",
      longitude: "82.8534000",
      status: "PENDING",
    };

    thekaRepository.create.mockResolvedValue(createdTheka);

    await thekaService.createTheka(
      userId,
      validThekaData,
    );

    expect(
      thekaRepository.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: userId,
      }),
    );
  });

  it("should not allow ownerUserId from request data", async () => {
    const maliciousData = {
      ...validThekaData,
      ownerUserId: 999,
    };

    thekaRepository.create.mockResolvedValue({
      id: 1,
      ownerUserId: userId,
      ...validThekaData,
      latitude: "25.4358000",
      longitude: "82.8534000",
      status: "PENDING",
    });

    await thekaService.createTheka(
      userId,
      maliciousData as any,
    );

    expect(
      thekaRepository.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: userId,
      }),
    );

    expect(
      thekaRepository.create,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 999,
      }),
    );
  });

  it("should create theka with PENDING status", async () => {
    thekaRepository.create.mockResolvedValue({
      id: 1,
      ownerUserId: userId,
      ...validThekaData,
      latitude: "25.4358000",
      longitude: "82.8534000",
      status: "PENDING",
    });

    await thekaService.createTheka(
      userId,
      validThekaData,
    );

    expect(
      thekaRepository.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "PENDING",
      }),
    );
  });

  it("should pass the registration data to the repository", async () => {
    thekaRepository.create.mockResolvedValue({
      id: 1,
      ownerUserId: userId,
      ...validThekaData,
      latitude: "25.4358000",
      longitude: "82.8534000",
      status: "PENDING",
    });

    await thekaService.createTheka(
      userId,
      validThekaData,
    );

    expect(
      thekaRepository.create,
    ).toHaveBeenCalledWith({
      ownerUserId: userId,
      name: validThekaData.name,
      contactPhone: validThekaData.contactPhone,
      address: validThekaData.address,
      city: validThekaData.city,
      state: validThekaData.state,
      pincode: validThekaData.pincode,
      latitude: validThekaData.latitude.toString(),
      longitude: validThekaData.longitude.toString(),
      aadhaarNumber: validThekaData.aadhaarNumber,
      gstNumber: validThekaData.gstNumber,
      licenseNumber: validThekaData.licenseNumber,
      status: "PENDING",
    });
  });

  it("should propagate repository errors", async () => {
    const repositoryError = new Error(
      "Failed to create theka",
    );

    thekaRepository.create.mockRejectedValue(
      repositoryError,
    );

    await expect(
      thekaService.createTheka(
        userId,
        validThekaData,
      ),
    ).rejects.toThrow("Failed to create theka");
  });

  // -------------------------------------------------------
  // GET MY THEKAS
  // -------------------------------------------------------

  it("should return thekas belonging to the authenticated user", async () => {
    const thekas = [
      {
        id: 1,
        ownerUserId: userId,
        name: "Sharma Wine Shop",
        status: "PENDING",
      },
      {
        id: 2,
        ownerUserId: userId,
        name: "Mishra Wine Shop",
        status: "PENDING",
      },
    ];

    thekaRepository.findByOwnerUserId.mockResolvedValue(
      thekas,
    );

    const result =
      await thekaService.getMyThekas(userId);

    expect(
      thekaRepository.findByOwnerUserId,
    ).toHaveBeenCalledTimes(1);

    expect(
      thekaRepository.findByOwnerUserId,
    ).toHaveBeenCalledWith(userId);

    expect(result).toEqual(thekas);
  });

  it("should return an empty array when the user has no thekas", async () => {
    thekaRepository.findByOwnerUserId.mockResolvedValue(
      [],
    );

    const result =
      await thekaService.getMyThekas(userId);

    expect(
      thekaRepository.findByOwnerUserId,
    ).toHaveBeenCalledWith(userId);

    expect(result).toEqual([]);
  });

  it("should propagate errors when fetching user's thekas fails", async () => {
    const repositoryError = new Error(
      "Failed to fetch thekas",
    );

    thekaRepository.findByOwnerUserId.mockRejectedValue(
      repositoryError,
    );

    await expect(
      thekaService.getMyThekas(userId),
    ).rejects.toThrow("Failed to fetch thekas");
  });

  // -------------------------------------------------------
  // GET THEKA BY ID
  // -------------------------------------------------------

  it("should return theka details for the authenticated owner", async () => {
    const thekaId = 10;

    const theka = {
      id: thekaId,
      ownerUserId: userId,
      name: "Sharma Wine Shop",
      status: "PENDING",
    };

    thekaRepository.findByIdAndOwnerUserId.mockResolvedValue(
      theka,
    );

    const result =
      await thekaService.getThekaById(
        thekaId,
        userId,
      );

    expect(
      thekaRepository.findByIdAndOwnerUserId,
    ).toHaveBeenCalledTimes(1);

    expect(
      thekaRepository.findByIdAndOwnerUserId,
    ).toHaveBeenCalledWith(
      thekaId,
      userId,
    );

    expect(result).toEqual(theka);
  });

  it("should return undefined when theka does not belong to the authenticated user", async () => {
    const thekaId = 10;

    thekaRepository.findByIdAndOwnerUserId.mockResolvedValue(
      undefined,
    );

    const result =
      await thekaService.getThekaById(
        thekaId,
        userId,
      );

    expect(
      thekaRepository.findByIdAndOwnerUserId,
    ).toHaveBeenCalledWith(
      thekaId,
      userId,
    );

    expect(result).toBeUndefined();
  });

  it("should propagate errors when fetching theka details fails", async () => {
    const repositoryError = new Error(
      "Failed to fetch theka",
    );

    thekaRepository.findByIdAndOwnerUserId.mockRejectedValue(
      repositoryError,
    );

    await expect(
      thekaService.getThekaById(10, userId),
    ).rejects.toThrow("Failed to fetch theka");
  });
});