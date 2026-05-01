import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { useBookContent, useUpdateCurrentBook } from "./useReader";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useBookContent", () => {
  it("fetches book content for a given bookId", async () => {
    const { result } = renderHook(() => useBookContent(1), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe("测试书籍");
    expect(result.current.data?.content).toContain("第一章");
  });

  it("does not fetch when bookId is 0", () => {
    const { result } = renderHook(() => useBookContent(0), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});

describe("useUpdateCurrentBook", () => {
  it("sends update and returns success", async () => {
    const { result } = renderHook(() => useUpdateCurrentBook(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ user_id: 1, book_id: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
