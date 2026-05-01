import { server } from "@/test/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http } from "msw";
import type React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ReaderPage from "./ReaderPage";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/reader/1"]}>
          <Routes>
            <Route path="/reader/:bookId" element={<ReaderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe("ReaderPage", () => {
  it("shows loading state initially", () => {
    render(<ReaderPage />, { wrapper: makeWrapper() });
    expect(screen.getByText(/加载中/)).toBeInTheDocument();
  });

  it("renders book title after content loads", async () => {
    render(<ReaderPage />, { wrapper: makeWrapper() });
    expect(await screen.findByText("测试书籍")).toBeInTheDocument();
  });

  it("renders the first page of content", async () => {
    render(<ReaderPage />, { wrapper: makeWrapper() });
    const matches = await screen.findAllByText(/第一章/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the TOC sidebar", async () => {
    render(<ReaderPage />, { wrapper: makeWrapper() });
    expect(
      await screen.findByRole("navigation", { name: /目录/ }),
    ).toBeInTheDocument();
  });

  it("shows settings button in header", async () => {
    render(<ReaderPage />, { wrapper: makeWrapper() });
    expect(
      await screen.findByRole("button", { name: /设置/ }),
    ).toBeInTheDocument();
  });

  it("shows error state when content fails to load", async () => {
    server.use(
      http.get("/api/book_content", () => new Response(null, { status: 500 })),
    );
    render(<ReaderPage />, { wrapper: makeWrapper() });
    expect(await screen.findByText(/加载失败/)).toBeInTheDocument();
  });
});
