import { describe, expect, it, vi } from "vitest";

vi.mock("./router", () => ({
  router: { routes: [] },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    RouterProvider: () => null,
  };
});

import App from "./App";

describe("App", () => {
  it("is a function component", () => {
    expect(typeof App).toBe("function");
  });
});
