import {describe, expect, beforeEach, it} from "vitest";
import { db } from "../../src/db";
import { users } from "../../src/db/schema";
import { cleanDatabase } from "../helpers/db";

describe("Database Test Isolation",()=>{
    beforeEach(async ()=>{
        await cleanDatabase();
    });

      it("should start with an empty users table", async () => {
    const result = await db.select().from(users);

    expect(result).toHaveLength(0);
  });

  it("should not contain data from the previous test", async () => {
    const result = await db.select().from(users);

    expect(result).toHaveLength(0);
  });
});