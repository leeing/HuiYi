import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/AuthContext", () => ({
  useAuth: () => ({
    status: "authenticated",
    userId: 1,
    username: "alice",
    avatar: "",
    signature: "",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/api/hooks/useBooks", () => ({
  useBooks: () => ({
    data: {
      books: [
        { id: 1, title: "红楼梦", author: "曹雪芹", progress: 30 },
        { id: 2, title: "西游记", author: "吴承恩", progress: 0 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useUploadBook: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

import BookshelfPage from "./BookshelfPage";

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BookshelfPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BookshelfPage", () => {
  it("renders the user's books", () => {
    renderPage();
    expect(screen.getByText("红楼梦")).toBeInTheDocument();
    expect(screen.getByText("西游记")).toBeInTheDocument();
  });

  it("shows the upload button", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /上传/i })).toBeInTheDocument();
  });

  it("opens upload modal when upload button is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /上传/i }));
    expect(screen.getByText(/上传书籍/i)).toBeInTheDocument();
  });

  it("shows the username in the header", () => {
    renderPage();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });
});
