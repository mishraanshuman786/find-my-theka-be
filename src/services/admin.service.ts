
import {
  adminRepository,
  AdminRepository,
  ThekaStatus,
} from "../repositories/admin.repository";


export class AdminService {
  constructor(
    private readonly repository: AdminRepository = adminRepository,
  ) {}

  async getStats() {
    return this.repository.getDashboardStats();
  }

  async getThekas(filters: {
    status?: ThekaStatus;
    expired?: boolean;
    limit: number;
    offset: number;
  }) {
    return this.repository.findThekas(filters);
  }

  async getThekaById(id: number) {
    return this.repository.findThekaById(id);
  }

  async approveTheka(id: number) {
    const theka = await this.repository.approveTheka(id);

    if (theka) {
      return theka;
    }

    // Distinguish a missing listing from one that cannot be approved.
    const existing = await this.repository.findThekaById(id);

    if (!existing) {
      throw new Error("THEKA_NOT_FOUND");
    }

    if (new Date(`${existing.licenseExpiryDate}T00:00:00.000Z`) <
        new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")) {
      throw new Error("LICENSE_EXPIRED");
    }

    throw new Error("THEKA_NOT_PENDING");
  }

  async rejectTheka(id: number) {
    const theka = await this.repository.rejectTheka(id);

    if (theka) {
      return theka;
    }

    const existing = await this.repository.findThekaById(id);

    if (!existing) {
      throw new Error("THEKA_NOT_FOUND");
    }

    throw new Error("THEKA_NOT_PENDING");
  }

  async deleteExpiredTheka(id: number) {
    const deleted = await this.repository.deleteExpiredTheka(id);

    if (deleted) {
      return deleted;
    }

    const existing = await this.repository.findThekaById(id);

    if (!existing) {
      throw new Error("THEKA_NOT_FOUND");
    }

    throw new Error("LICENSE_NOT_EXPIRED");
  }

  async getUsers(limit: number, offset: number) {
    return this.repository.findUsers(limit, offset);
  }

  async getUserById(id: number) {
    return this.repository.findUserById(id);
  }
}

export const adminService = new AdminService();
