import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import AiOverlay from "./AiOverlay";

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

describe("AiOverlay", () => {
  it("renders the selected text in the dialog", () => {
    render(
      <AiOverlay
        selectedText="这段话很难理解"
        bookContext="第一章"
        onClose={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("这段话很难理解")).toBeInTheDocument();
  });

  it("shows AI response after loading", async () => {
    render(
      <AiOverlay
        selectedText="这段话很难理解"
        bookContext="第一章"
        onClose={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );
    // The overlay auto-fires the chat mutation on mount
    expect(
      await screen.findByText("这是一个测试 AI 回复。"),
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<AiOverlay selectedText="文字" bookContext="" onClose={onClose} />, {
      wrapper: makeWrapper(),
    });
    await userEvent.click(screen.getByRole("button", { name: /关闭/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
