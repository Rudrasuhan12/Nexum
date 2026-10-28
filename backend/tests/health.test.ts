import { describe, it, expect } from "vitest";
import app from "../src/index.js";

describe("Backend API Core", () => {
  it("should export an Express application instance", () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });

  it("should have routes configured", () => {
    // Check router stack
    const stack = app._router.stack;
    const layerNames = stack.map((l: any) => l.name);
    expect(layerNames).toContain("router");
  });
});

