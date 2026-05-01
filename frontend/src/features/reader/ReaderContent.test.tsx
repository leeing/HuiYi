import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReaderContent from "./ReaderContent";

const CONTENT = `第一章 开始\n\n${"字".repeat(900)}\n\n第二章 中间\n\n${"字".repeat(900)}`;

describe("ReaderContent", () => {
  it("renders the current page text", () => {
    render(
      <ReaderContent
        content="这是第一页内容"
        currentPage={0}
        fontSize={18}
        onPageChange={vi.fn()}
        onSelectionChange={vi.fn()}
        charsPerPage={100}
      />,
    );
    expect(screen.getByText("这是第一页内容")).toBeInTheDocument();
  });

  it("shows page number indicator", () => {
    render(
      <ReaderContent
        content={CONTENT}
        currentPage={0}
        fontSize={18}
        onPageChange={vi.fn()}
        onSelectionChange={vi.fn()}
        charsPerPage={800}
      />,
    );
    // Should show "1 / N" style indicator
    expect(screen.getByText(/1\s*\/\s*\d+/)).toBeInTheDocument();
  });

  it("calls onPageChange with next page when 下一页 is clicked", async () => {
    const onPageChange = vi.fn();
    render(
      <ReaderContent
        content={CONTENT}
        currentPage={0}
        fontSize={18}
        onPageChange={onPageChange}
        onSelectionChange={vi.fn()}
        charsPerPage={800}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /下一页/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with previous page when 上一页 is clicked", async () => {
    const onPageChange = vi.fn();
    render(
      <ReaderContent
        content={CONTENT}
        currentPage={1}
        fontSize={18}
        onPageChange={onPageChange}
        onSelectionChange={vi.fn()}
        charsPerPage={800}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /上一页/ }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it("上一页 button is disabled on the first page", () => {
    render(
      <ReaderContent
        content={CONTENT}
        currentPage={0}
        fontSize={18}
        onPageChange={vi.fn()}
        onSelectionChange={vi.fn()}
        charsPerPage={800}
      />,
    );
    expect(screen.getByRole("button", { name: /上一页/ })).toBeDisabled();
  });

  it("下一页 button is disabled on the last page", () => {
    const shortContent = "一".repeat(10);
    render(
      <ReaderContent
        content={shortContent}
        currentPage={0}
        fontSize={18}
        onPageChange={vi.fn()}
        onSelectionChange={vi.fn()}
        charsPerPage={800}
      />,
    );
    expect(screen.getByRole("button", { name: /下一页/ })).toBeDisabled();
  });
});
