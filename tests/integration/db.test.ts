import {describe, it, expect} from "vitest";

import { pool } from "../../src/db";

describe("Database Connection",()=>{
    it("should connect to the database",async ()=>{
        const result=await pool.query("SELECT current_database()");

        expect(result.rows[0].current_database).toBe("findmytheka_test")
    })
})