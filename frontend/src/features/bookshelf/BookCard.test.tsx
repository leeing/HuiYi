import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BookCard from "./BookCard";

vi.mock("@/api/hooks/useBooks", () => ({
  useUpdateBook: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteBook: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDownloadBook: () => vi.fn(),
}));

const book = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "红楼梦",
  author: "曹雪芹",
  progress: 42,
};

const userId = "00000000-0000-0000-0000-000000000001";

function renderBookCard() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BookCard book={book} userId={userId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BookCard", () => {
  it("renders book title and author", () => {
    renderBookCard();
    expect(screen.getByText("红楼梦")).toBeInTheDocument();
    expect(screen.getByText("曹雪芹")).toBeInTheDocument();
  });

  it("shows progress percentage", () => {
    renderBookCard();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });

  it("links to the reader page", () => {
    renderBookCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/reader/00000000-0000-0000-0000-000000000001",
    );
  });
});
