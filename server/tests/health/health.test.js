import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";

describe("GET /api/v1/health", () => {
  test("responds 200 with status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("Unknown routes", () => {
  test("responds 404 for a route that doesn't exist", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/route not found/i);
  });
});
