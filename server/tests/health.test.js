const express = require("express");
const request = require("supertest");
const healthHandler = require("../utils/health");

const app = express();
app.get("/health", healthHandler);

describe("GET /health", () => {
  it("returns a healthy application response", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});