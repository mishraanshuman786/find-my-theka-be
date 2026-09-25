import request from "supertest";
import { describe, it, expect } from "vitest";

import app from "../../src/app";

describe("GET /", () => {
  it("should return API information", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      name: "Find My Theka API",
      version: "1.0.0",
      status: "running",
    });
  });
});
