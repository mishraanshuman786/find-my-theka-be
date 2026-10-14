
import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import type { ThekaStatus } from "../repositories/admin.repository";


function parseId(value: string | string[] | undefined): number | null {
  // Reject missing or multiple IDs
  if (typeof value !== "string") {
    return null;
  }

  // Reject empty values and non-numeric IDs
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parsePagination(query: Request["query"]) {
  const rawLimit = query.limit;
  const rawPage = query.page;

  const limitValue = rawLimit === undefined ? 20 : Number(rawLimit);
  const pageValue = rawPage === undefined ? 1 : Number(rawPage);

  if (
    !Number.isInteger(limitValue) ||
    limitValue < 1 ||
    limitValue > 100 ||
    !Number.isInteger(pageValue) ||
    pageValue < 1
  ) {
    return null;
  }

  return {
    limit: limitValue,
    page: pageValue,
    offset: (pageValue - 1) * limitValue,
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
    try {
      const stats = await adminService.getStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Admin dashboard stats error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics",
      });
    }
  }

  async getThekas(req: Request, res: Response) {
    try {
      const pagination = parsePagination(req.query);

      if (!pagination) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination. Use page >= 1 and limit between 1 and 100.",
        });
      }

      const statusValue = req.query.status;
      let status: ThekaStatus | undefined;

      if (statusValue !== undefined) {
        if (
          typeof statusValue !== "string" ||
          !validStatuses.includes(statusValue as ThekaStatus)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid theka status",
          });
        }

        status = statusValue as ThekaStatus;
      }

      const expiredValue = req.query.filter === "expired";

      if (
        req.query.filter !== undefined &&
        req.query.filter !== "expired"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid filter. Supported filter: expired",
        });
      }

      if (expiredValue && status) {
        return res.status(400).json({
          success: false,
          message: "Use either status or filter=expired, not both",
        });
      }

      const result = await adminService.getThekas({
        ...pagination,
        status,
        expired: expiredValue,
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
    } catch (error) {
      console.error("Admin list thekas error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch thekas",
      });
    }
  }

  async getThekaById(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid theka ID",
        });
      }

      const theka = await adminService.getThekaById(id);

      if (!theka) {
        return res.status(404).json({
          success: false,
          message: "Theka not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: theka,
      });
    } catch (error) {
      console.error("Admin get theka error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch theka",
      });
    }
  }

  async approveTheka(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid theka ID",
        });
      }

      const theka = await adminService.approveTheka(id);

      return res.status(200).json({
        success: true,
        message: "Theka approved successfully",
        data: theka,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "THEKA_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            message: "Theka not found",
          });
        }

        if (error.message === "LICENSE_EXPIRED") {
          return res.status(409).json({
            success: false,
            message: "Cannot approve a theka with an expired license",
          });
        }

        if (error.message === "THEKA_NOT_PENDING") {
          return res.status(409).json({
            success: false,
            message: "Only pending thekas can be approved",
          });
        }
      }

      console.error("Admin approve theka error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to approve theka",
      });
    }
  }

  async rejectTheka(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid theka ID",
        });
      }

      const theka = await adminService.rejectTheka(id);

      return res.status(200).json({
        success: true,
        message: "Theka rejected successfully",
        data: theka,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "THEKA_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            message: "Theka not found",
          });
        }

        if (error.message === "THEKA_NOT_PENDING") {
          return res.status(409).json({
            success: false,
            message: "Only pending thekas can be rejected",
          });
        }
      }

      console.error("Admin reject theka error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reject theka",
      });
    }
  }

  async deleteExpiredTheka(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid theka ID",
        });
      }

      await adminService.deleteExpiredTheka(id);

      return res.status(200).json({
        success: true,
        message: "Expired theka listing deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "THEKA_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            message: "Theka not found",
          });
        }

        if (error.message === "LICENSE_NOT_EXPIRED") {
          return res.status(409).json({
            success: false,
            message: "This listing cannot be deleted because its license has not expired",
          });
        }
      }

      console.error("Admin delete theka error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete expired listing",
      });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const pagination = parsePagination(req.query);

      if (!pagination) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination",
        });
      }

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
    } catch (error) {
      console.error("Admin list users error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const user = await adminService.getUserById(id);

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
      console.error("Admin get user error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch user",
      });
    }
  }
}

export const adminController = new AdminController();
