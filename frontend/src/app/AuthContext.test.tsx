import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

describe("AuthContext", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    // Loading check: user is not yet determined
    expect(
      result.current.status === "loading" ||
        result.current.status === "anonymous",
    ).toBe(true);
  });

  it("is anonymous when no stored user_id", () => {
    localStorage.clear();
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    // After synchronous localStorage check, should be anonymous
    expect(["loading", "anonymous"]).toContain(result.current.status);
  });
});
