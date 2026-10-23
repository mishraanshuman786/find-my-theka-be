
import type { Request, Response } from "express";

import { adminService } from "../services/admin.service";
import type { ThekaStatus } from "../repositories/admin.repository";
import { AppError } from "../utils/app-error";

function parseId(value: string | string[] | undefined): number {
  // Reject missing or multiple IDs.
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError("Invalid ID", 400);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError("Invalid ID", 400);
  }

  return id;
}

function parsePagination(query: Request["query"]) {
  const rawLimit = query.limit;
  const rawPage = query.page;

  // Reject repeated query parameters.
  if (
    (rawLimit !== undefined && typeof rawLimit !== "string") ||
    (rawPage !== undefined && typeof rawPage !== "string")
  ) {
    throw new AppError(
      "Invalid pagination. Use page >= 1 and limit between 1 and 100.",
      400,
    );
  }

  const limit = rawLimit === undefined ? 20 : Number(rawLimit);
  const page = rawPage === undefined ? 1 : Number(rawPage);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger((page - 1) * limit)
  ) {
    throw new AppError(
      "Invalid pagination. Use page >= 1 and limit between 1 and 100.",
      400,
    );
  }

  return {
    limit,
    page,
    offset: (page - 1) * limit,
  };
}

const validStatuses: ThekaStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
];

export class AdminController {
  async getStats(_req: Request, res: Response) {
    const stats = await adminService.getStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  }

  async getThekas(req: Request, res: Response) {
    const pagination = parsePagination(req.query);

    const statusValue = req.query.status;
    let status: ThekaStatus | undefined;

    if (statusValue !== undefined) {
      if (
        typeof statusValue !== "string" ||
        !validStatuses.includes(statusValue as ThekaStatus)
      ) {
        throw new AppError("Invalid theka status", 400);
      }

      status = statusValue as ThekaStatus;
    }

    const filterValue = req.query.filter;

    if (
      filterValue !== undefined &&
      (typeof filterValue !== "string" || filterValue !== "expired")
    ) {
      throw new AppError(
        "Invalid filter. Supported filter: expired",
        400,
      );
    }

    const expired = filterValue === "expired";

    if (expired && status) {
      throw new AppError(
        "Use either status or filter=expired, not both",
        400,
      );
    }

    const result = await adminService.getThekas({
      ...pagination,
      status,
      expired,
    });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: pagination.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  }

  async getThekaById(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const theka = await adminService.getThekaById(id);

    if (!theka) {
      throw new AppError("THEKA_NOT_FOUND", 404);
    }

    return res.status(200).json({
      success: true,
      data: theka,
    });
  }

  async approveTheka(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const theka = await adminService.approveTheka(id);

    return res.status(200).json({
      success: true,
      message: "Theka approved successfully",
      data: theka,
    });
  }

  async rejectTheka(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const theka = await adminService.rejectTheka(id);

    return res.status(200).json({
      success: true,
      message: "Theka rejected successfully",
      data: theka,
    });
  }

  async deleteExpiredTheka(req: Request, res: Response) {
    const id = parseId(req.params.id);

    await adminService.deleteExpiredTheka(id);

    return res.status(200).json({
      success: true,
      message: "Expired theka listing deleted successfully",
    });
  }

  async getUsers(req: Request, res: Response) {
    const pagination = parsePagination(req.query);

    const result = await adminService.getUsers(
      pagination.limit,
      pagination.offset,
    );

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: pagination.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  }

  async getUserById(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const user = await adminService.getUserById(id);

    if (!user) {
      throw new AppError("USER_NOT_FOUND", 404);
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  }
}

export const adminController = new AdminController();
