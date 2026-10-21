import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("answers ok without authentication", async () => {
    const response = await GET(new Request("http://localhost/api/health"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
