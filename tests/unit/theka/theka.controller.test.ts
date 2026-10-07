import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { Request, Response } from "express";

import { ThekaController } from "../../../src/controllers/theka.controller";

import { thekaService } from "../../../src/services/theka.service";

vi.mock("../../../src/services/theka.service", () => ({
  thekaService: {
    createTheka: vi.fn(),
    getMyThekas: vi.fn(),
    getThekaById: vi.fn(),
  },
}));

let controller: ThekaController;

type AuthenticatedRequest = Partial<Request> & {
  user?: {
    userId: number;
  };
};

let req: AuthenticatedRequest;
let res: Partial<Response>;

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

  controller = new ThekaController();

  req = {
    body: validThekaData,
    user: {
      userId: 1,
    },
  };

  res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
});

// =======================================================
// CREATE THEKA
// =======================================================

describe("ThekaController - createTheka", () => {
  it("should create a theka successfully", async () => {
    const createdTheka = {
      id: 1,
      ownerUserId: 1,
      ...validThekaData,
      latitude: "25.4358",
      longitude: "82.8534",
      status: "PENDING",
    };

    vi.mocked(
      thekaService.createTheka,
    ).mockResolvedValue(createdTheka as any);

    await controller.create(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.createTheka,
    ).toHaveBeenCalledWith(
      1,
      validThekaData,
    );

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message:
        "Theka registration submitted successfully",
      data: createdTheka,
    });
  });

  it("should use the authenticated user id", async () => {
    const createdTheka = {
      id: 1,
      ownerUserId: 1,
      ...validThekaData,
      latitude: "25.4358",
      longitude: "82.8534",
      status: "PENDING",
    };

    vi.mocked(
      thekaService.createTheka,
    ).mockResolvedValue(createdTheka as any);

    await controller.create(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.createTheka,
    ).toHaveBeenCalledWith(
      req.user!.userId,
      validThekaData,
    );
  });

  it("should return 401 when user is not authenticated", async () => {
    req.user = undefined;

    await controller.create(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.createTheka,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized!",
    });
  });

  it("should return 400 when request body is invalid", async () => {
    req.body = {
      ...validThekaData,
      name: "",
    };

    await controller.create(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.createTheka,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message:
          "Invalid Theka Registration Data!",
        error: expect.any(Object),
      }),
    );
  });

  it("should return 400 when required fields are missing", async () => {
    req.body = {};

    await controller.create(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.createTheka,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message:
          "Invalid Theka Registration Data!",
        error: expect.any(Object),
      }),
    );
  });

  it("should return 500 when theka creation fails", async () => {
    vi.mocked(
      thekaService.createTheka,
    ).mockRejectedValue(
      new Error("Database error"),
    );

    await controller.create(
      req as Request,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error!",
    });
  });
});

// =======================================================
// GET MY THEKAS
// =======================================================

describe("ThekaController - getMyThekas", () => {
  it("should return the authenticated user's thekas", async () => {
    const thekas = [
      {
        id: 1,
        ownerUserId: 1,
        name: "Sharma Wine Shop",
        status: "PENDING",
      },
    ];

    vi.mocked(
      thekaService.getMyThekas,
    ).mockResolvedValue(thekas as any);

    await controller.getMyThekas(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getMyThekas,
    ).toHaveBeenCalledWith(1);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: thekas,
    });
  });

  it("should return an empty array when the user has no thekas", async () => {
    vi.mocked(
      thekaService.getMyThekas,
    ).mockResolvedValue([]);

    await controller.getMyThekas(
      req as Request,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    });
  });

  it("should return 401 when listing thekas without authentication", async () => {
    req.user = undefined;

    await controller.getMyThekas(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getMyThekas,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized!",
    });
  });

  it("should return 500 when fetching thekas fails", async () => {
    vi.mocked(
      thekaService.getMyThekas,
    ).mockRejectedValue(
      new Error("Database error"),
    );

    await controller.getMyThekas(
      req as Request,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error!",
    });
  });
});

// =======================================================
// GET THEKA BY ID
// =======================================================

describe("ThekaController - getById", () => {
  it("should return theka details", async () => {
    const theka = {
      id: 10,
      ownerUserId: 1,
      name: "Sharma Wine Shop",
      status: "PENDING",
    };

    vi.mocked(
      thekaService.getThekaById,
    ).mockResolvedValue(theka as any);

    req.params = {
      id: "10",
    };

    await controller.getById(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getThekaById,
    ).toHaveBeenCalledWith(10, 1);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: theka,
    });
  });

  it("should return 404 when theka is not found", async () => {
    vi.mocked(
      thekaService.getThekaById,
    ).mockResolvedValue(undefined);

    req.params = {
      id: "999",
    };

    await controller.getById(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getThekaById,
    ).toHaveBeenCalledWith(999, 1);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Theka not found",
    });
  });

  it("should return 400 when theka id is invalid", async () => {
    req.params = {
      id: "abc",
    };

    await controller.getById(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getThekaById,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid theka ID",
    });
  });

  it("should return 400 when theka id is zero", async () => {
    req.params = {
      id: "0",
    };

    await controller.getById(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getThekaById,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 401 when fetching theka without authentication", async () => {
    req.user = undefined;

    req.params = {
      id: "10",
    };

    await controller.getById(
      req as Request,
      res as Response,
    );

    expect(
      thekaService.getThekaById,
    ).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized!",
    });
  });

  it("should return 500 when fetching theka fails", async () => {
    vi.mocked(
      thekaService.getThekaById,
    ).mockRejectedValue(
      new Error("Database error"),
    );

    req.params = {
      id: "10",
    };

    await controller.getById(
      req as Request,
      res as Response,
    );

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error!",
    });
  });
});