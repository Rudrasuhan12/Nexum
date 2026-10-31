import { describe, it, expect } from "vitest";
import app from "../src/index.js";

describe("Notifications & Presence API", () => {
  it("should have /api/notifications route registered", () => {
    const stack = app._router.stack;
    const paths = stack
      .filter((layer: any) => layer.route || layer.name === "router")
      .map((layer: any) => layer.regexp.toString());
    
    // Check router mounts
    expect(paths.some((p: string) => p.includes("notifications"))).toBe(true);
    expect(paths.some((p: string) => p.includes("users"))).toBe(true);
  });
});

