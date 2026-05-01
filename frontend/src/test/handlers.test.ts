import { describe, expect, it } from "vitest";
import { handlers } from "./handlers";

describe("MSW handlers", () => {
  it("exports an array with all 9 endpoint handlers", () => {
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers).toHaveLength(9);
  });
});
