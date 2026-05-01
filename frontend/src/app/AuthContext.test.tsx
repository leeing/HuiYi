import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  it("is anonymous when no stored auth in localStorage", () => {
    localStorage.clear();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("anonymous");
  });

  it("is authenticated when valid auth is in localStorage", () => {
    localStorage.setItem(
      "huiyi_auth",
      JSON.stringify({
        userId: 42,
        username: "alice",
        avatar: "",
        signature: "",
      }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("authenticated");
    if (result.current.status === "authenticated") {
      expect(result.current.userId).toBe(42);
      expect(result.current.username).toBe("alice");
    }
  });

  it("login() updates state to authenticated", () => {
    localStorage.clear();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("anonymous");
    act(() => {
      result.current.login(1, "bob", "", "");
    });
    expect(result.current.status).toBe("authenticated");
  });

  it("logout() updates state to anonymous", () => {
    localStorage.setItem(
      "huiyi_auth",
      JSON.stringify({ userId: 1, username: "bob", avatar: "", signature: "" }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("authenticated");
    act(() => {
      result.current.logout();
    });
    expect(result.current.status).toBe("anonymous");
  });
});
