import { describe, expect, it } from "vitest";
import { handlers } from "./handlers";

describe("MSW handlers", () => {
  it("exports a non-empty array of handlers", () => {
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
  });
});
