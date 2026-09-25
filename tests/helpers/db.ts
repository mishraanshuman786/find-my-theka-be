import {sql} from "drizzle-orm";
import { db } from "../../src/db";

export async function cleanDatabase(){
    await db.execute( sql`
      TRUNCATE TABLE
        password_reset_otps,
        search_history,
        users
      RESTART IDENTITY
      CASCADE;
    `)
}