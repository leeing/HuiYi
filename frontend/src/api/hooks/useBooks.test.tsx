import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { useBooks, useUploadBook } from "./useBooks";

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

describe("useBooks", () => {
  it("exports as a function", () => {
    expect(typeof useBooks).toBe("function");
  });

  it("fetches books for a user", async () => {
    const { result } = renderHook(() => useBooks(1), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.books).toHaveLength(1);
    expect(result.current.data?.books[0]?.title).toBe("测试书籍");
  });

  it("does not fetch when userId is 0", () => {
    const { result } = renderHook(() => useBooks(0), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});

describe("useUploadBook", () => {
  it("exports as a function", () => {
    expect(typeof useUploadBook).toBe("function");
  });

  it("uploads a book and returns book_id", async () => {
    const { result } = renderHook(() => useUploadBook(1), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ filename: "test.txt", content: "aGVsbG8=" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.book_id).toBe(1);
  });
});
