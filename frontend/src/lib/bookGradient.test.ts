import { describe, expect, it } from "vitest";
import { bookGradient } from "./bookGradient";

describe("bookGradient", () => {
  it("returns a CSS gradient string", () => {
    const result = bookGradient("红楼梦");
    expect(result).toMatch(/^linear-gradient/);
  });

  it("is deterministic — same title always returns same gradient", () => {
    expect(bookGradient("水浒传")).toBe(bookGradient("水浒传"));
  });

  it("returns different gradients for different titles", () => {
    expect(bookGradient("三国演义")).not.toBe(bookGradient("西游记"));
  });

  it("handles empty string without throwing", () => {
    expect(() => bookGradient("")).not.toThrow();
  });
});
