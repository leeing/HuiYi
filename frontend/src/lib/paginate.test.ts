import { describe, expect, it } from "vitest";
import { paginate } from "./paginate";

describe("paginate", () => {
  it("returns a single page when content fits", () => {
    const pages = paginate("hello", 100);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toBe("hello");
  });

  it("splits content across multiple pages", () => {
    const content = "a".repeat(250);
    const pages = paginate(content, 100);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(100);
    expect(pages[1]).toHaveLength(100);
    expect(pages[2]).toHaveLength(50);
  });

  it("does not split mid-word when possible", () => {
    // "hello world foo" with limit 12: should split at word boundary after "hello world" (11 chars)
    const pages = paginate("hello world foo", 12);
    expect(pages[0]).toBe("hello world");
    expect(pages[1]).toBe("foo");
  });

  it("returns [''] for empty string", () => {
    const pages = paginate("", 100);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toBe("");
  });

  it("handles content exactly equal to page size", () => {
    const content = "a".repeat(100);
    const pages = paginate(content, 100);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(100);
  });

  it("falls back to hard cut when no whitespace in range", () => {
    // "abcdefghij" with limit 4: no spaces, so must hard-cut every 4 chars
    const pages = paginate("abcdefghij", 4);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toBe("abcd");
    expect(pages[1]).toBe("efgh");
    expect(pages[2]).toBe("ij");
  });
});
