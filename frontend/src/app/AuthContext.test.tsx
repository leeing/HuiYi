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
        userId: "00000000-0000-0000-0000-000000000042",
        username: "alice",
        avatar: "",
        signature: "",
      }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("authenticated");
    if (result.current.status === "authenticated") {
      expect(result.current.userId).toBe(
        "00000000-0000-0000-0000-000000000042",
      );
      expect(result.current.username).toBe("alice");
    }
  });

  it("login() updates state to authenticated", () => {
    localStorage.clear();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe("anonymous");
    act(() => {
      result.current.login(
        "00000000-0000-0000-0000-000000000001",
        "bob",
        "",
        "",
      );
    });
    expect(result.current.status).toBe("authenticated");
  });

  it("logout() resets state to anonymous and clears localStorage", () => {
    localStorage.setItem(
      "huiyi_auth",
      JSON.stringify({
        userId: "00000000-0000-0000-0000-000000000001",
        username: "bob",
        avatar: "",
        signature: "",
      }),
    );
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      ),
    });
    expect(result.current.status).toBe("authenticated");
    act(() => {
      result.current.logout();
    });
    expect(result.current.status).toBe("anonymous");
    expect(localStorage.getItem("huiyi_auth")).toBeNull();
  });

  it("starts in loading state before useEffect fires", () => {
    localStorage.clear();
    // Use renderHook with no act wrapping to capture the initial synchronous state
    let initialStatus: string | undefined;
    renderHook(
      () => {
        const auth = useAuth();
        if (initialStatus === undefined) {
          initialStatus = auth.status;
        }
        return auth;
      },
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <AuthProvider>{children}</AuthProvider>
        ),
      },
    );
    // The very first render (before useEffect) should be "loading"
    expect(initialStatus).toBe("loading");
  });
});
