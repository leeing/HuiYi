import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BookCard from "./BookCard";

const book = { id: 1, title: "红楼梦", author: "曹雪芹", progress: 42 };

describe("BookCard", () => {
  it("renders book title and author", () => {
    render(
      <MemoryRouter>
        <BookCard book={book} />
      </MemoryRouter>,
    );
    expect(screen.getByText("红楼梦")).toBeInTheDocument();
    expect(screen.getByText("曹雪芹")).toBeInTheDocument();
  });

  it("shows progress percentage", () => {
    render(
      <MemoryRouter>
        <BookCard book={book} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });

  it("links to the reader page", () => {
    render(
      <MemoryRouter>
        <BookCard book={book} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/reader/1");
  });
});
