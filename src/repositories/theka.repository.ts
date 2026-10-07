import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { thekas } from "../db/schema";

export class ThekaRepository {
  async create(data: typeof thekas.$inferInsert) {
    const [theka] = await db
      .insert(thekas)
      .values(data)
      .returning();

    return theka;
  }

  async findById(id: number) {
    const [theka] = await db
      .select()
      .from(thekas)
      .where(eq(thekas.id, id))
      .limit(1);

    return theka;
  }

  async findByOwnerUserId(ownerUserId: number) {
    return db
      .select()
      .from(thekas)
      .where(eq(thekas.ownerUserId, ownerUserId));
  }

  async findByIdAndOwnerUserId(
    id: number,
    ownerUserId: number,
  ) {
    const [theka] = await db
      .select()
      .from(thekas)
      .where(
        and(
          eq(thekas.id, id),
          eq(thekas.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);

    return theka;
  }
}

export const thekaRepository =
  new ThekaRepository();