import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { useLogin, useRegister } from "./useAuth";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useLogin", () => {
  it("exports as a function", () => {
    expect(typeof useLogin).toBe("function");
  });

  it("calls POST /api/login and returns auth response", async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    result.current.mutate({ username: "alice", password: "secret" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user_id).toBe(
      "00000000-0000-0000-0000-000000000001",
    );
    expect(result.current.data?.message).toBe("ok");
  });
});

describe("useRegister", () => {
  it("exports as a function", () => {
    expect(typeof useRegister).toBe("function");
  });

  it("calls POST /api/register and returns auth response", async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ username: "bob", password: "secret123" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user_id).toBe(
      "00000000-0000-0000-0000-000000000001",
    );
    expect(result.current.data?.message).toBe("ok");
  });
});
