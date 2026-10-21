
import { and, eq, sql } from "drizzle-orm";

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

  async findByRegistrationRequestKey(
    ownerUserId: number,
    requestKey: string,
  ) {
    const [theka] = await db
      .select()
      .from(thekas)
      .where(
        and(
          eq(thekas.ownerUserId, ownerUserId),
          eq(thekas.registrationRequestKey, requestKey),
        ),
      )
      .limit(1);

    return theka;
  }

  async markVerified(id: number, ownerUserId: number) {
    const [theka] = await db
      .update(thekas)
      .set({
        status: "VERIFIED",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(thekas.id, id),
          eq(thekas.ownerUserId, ownerUserId),
        ),
      )
      .returning();

    return theka;
  }

  // get the nearest verified thekas to the users location
  async findNearbyVerified(latitude:number,longitude:number,radiusMeters:number, limit:number){
    const distanceMeters = sql<number>`
      (
        6371000 * 2 * ASIN(
          SQRT(
            LEAST(1.0, GREATEST(0.0,
              POWER(
                SIN(
                  RADIANS(
                    (${thekas.latitude}::double precision - ${latitude}) / 2.0
                  )
                ),
                2
              )
              +
              COS(RADIANS(${latitude}))
              * COS(${thekas.latitude}::double precision * PI() / 180.0)
              * POWER(
                SIN(
                  RADIANS(
                    (${thekas.longitude}::double precision - ${longitude}) / 2.0
                  )
                ),
                2
              )
            ))
          )
        )
      )
    `;

    const rows=await db.select({
      id:thekas.id,
      name:thekas.name,
      address:thekas.address,
      city:thekas.city,
      state:thekas.state,
      pincode: thekas.pincode,
      latitude:thekas.latitude,
      longitude: thekas.longitude,
      distanceMeters
    }).from(thekas).where(and(
      eq(thekas.status,"VERIFIED"),
       sql`${thekas.latitude} BETWEEN -90 AND 90`,
       sql`${thekas.longitude} BETWEEN -180 AND 180`,
       sql`${distanceMeters} <= ${radiusMeters}`,
    )).orderBy(distanceMeters)
      .limit(limit);

      return rows.map((row:any) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distanceMeters: Math.round(Number(row.distanceMeters)),
    }));


  }
}

export const thekaRepository = new ThekaRepository();
