import {and, count, desc, eq, sql} from "drizzle-orm";

import { db } from "../db";
import {thekas, users} from "../db/schema";

export type ThekaStatus="PENDING"| "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export interface AdminThekaFilters{
      status?:ThekaStatus;
      expired?:boolean;
      limit:number;
      offset:number;
}

export class AdminRepository{
  
async getDashboardStats() {
  const startedAt = Date.now();

  try {
    const [pendingResult, approvedResult, expiredResult] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(thekas)
          .where(eq(thekas.status, "PENDING")),

        db
          .select({ value: count() })
          .from(thekas)
          .where(eq(thekas.status, "VERIFIED")),

        db
          .select({ value: count() })
          .from(thekas)
          .where(sql`${thekas.licenseExpiryDate} < CURRENT_DATE`),
      ]);

    const stats = {
      pending: pendingResult[0].value,
      approved: approvedResult[0].value,
      expired: expiredResult[0].value,
    };

    console.log(
      `[Admin Dashboard] Stats loaded in ${Date.now() - startedAt}ms`,
      stats,
    );

    return stats;
  } catch (error) {
    console.error(
      `[Admin Dashboard] Stats query failed after ${Date.now() - startedAt}ms`,
      error,
    );

    throw error;
  }
}


    async findThekas(filters:AdminThekaFilters){
        const conditions=[];

    if (filters.status) {
      conditions.push(eq(thekas.status, filters.status));
    }

    if (filters.expired) {
      conditions.push(
        sql`${thekas.licenseExpiryDate} < CURRENT_DATE`,
      );
    }

     const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

       const itemsQuery = db
      .select({
        id: thekas.id,
        ownerUserId: thekas.ownerUserId,
        name: thekas.name,
        contactPhone: thekas.contactPhone,
        address: thekas.address,
        city: thekas.city,
        state: thekas.state,
        pincode: thekas.pincode,
        latitude: thekas.latitude,
        longitude: thekas.longitude,
        gstNumber: thekas.gstNumber,
        licenseNumber: thekas.licenseNumber,
        licenseExpiryDate: thekas.licenseExpiryDate,
        status: thekas.status,
        createdAt: thekas.createdAt,
        updatedAt: thekas.updatedAt,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(thekas)
      .leftJoin(users, eq(thekas.ownerUserId, users.id))
      .where(whereClause)
      .orderBy(desc(thekas.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const totalQuery = db
      .select({ value: count() })
      .from(thekas)
      .where(whereClause);

    const [items, [total]] = await Promise.all([
      itemsQuery,
      totalQuery,
    ]);

    return {
      items,
      total: total.value,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  async findThekaById(id: number) {
    const [theka] = await db
      .select({
        id: thekas.id,
        ownerUserId: thekas.ownerUserId,
        name: thekas.name,
        contactPhone: thekas.contactPhone,
        address: thekas.address,
        city: thekas.city,
        state: thekas.state,
        pincode: thekas.pincode,
        latitude: thekas.latitude,
        longitude: thekas.longitude,
        gstNumber: thekas.gstNumber,
        licenseNumber: thekas.licenseNumber,
        licenseExpiryDate: thekas.licenseExpiryDate,
        status: thekas.status,
        createdAt: thekas.createdAt,
        updatedAt: thekas.updatedAt,
        ownerName: users.name,
        ownerEmail: users.email,
        ownerPhone: users.phone,
      })
      .from(thekas)
      .leftJoin(users, eq(thekas.ownerUserId, users.id))
      .where(eq(thekas.id, id))
      .limit(1);

    return theka;
  }

  async approveTheka(id: number) {
    const [theka] = await db
      .update(thekas)
      .set({
        status: "VERIFIED",
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(thekas.id, id),
          eq(thekas.status, "PENDING"),
          sql`${thekas.licenseExpiryDate} >= CURRENT_DATE`,
        ),
      )
      .returning();

    return theka;
  }

  async rejectTheka(id: number) {
    const [theka] = await db
      .update(thekas)
      .set({
        status: "REJECTED",
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(
        and(
          eq(thekas.id, id),
          eq(thekas.status, "PENDING"),
        ),
      )
      .returning();

    return theka;
  }

  async deleteExpiredTheka(id: number) {
    const [deleted] = await db
      .delete(thekas)
      .where(
        and(
          eq(thekas.id, id),
          sql`${thekas.licenseExpiryDate} < CURRENT_DATE`,
        ),
      )
      .returning({ id: thekas.id });

    return deleted;
  }

  async findUsers(limit: number, offset: number) {
    const [items, [total]] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ value: count() }).from(users),
    ]);

    return {
      items,
      total: total.value,
      limit,
      offset,
    };
  }

  async findUserById(id: number) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }


    
}

export const adminRepository=new AdminRepository();