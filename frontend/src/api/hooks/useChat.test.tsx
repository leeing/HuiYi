import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { useChat } from "./useChat";

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

describe("useChat", () => {
  it("sends a chat message and returns the AI response", async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ message: "解释这段文字", book_context: "第一章" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.response).toBe("这是一个测试 AI 回复。");
  });
});
