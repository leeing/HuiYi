import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TocSidebar from "./TocSidebar";

const CONTENT_WITH_CHAPTERS =
  "第一章 开始\n\n一些内容\n\n第二章 中间\n\n更多内容\n\n第三章 结尾\n\n结束内容";

describe("TocSidebar", () => {
  it("extracts and renders chapter headings", () => {
    render(
      <TocSidebar
        content={CONTENT_WITH_CHAPTERS}
        currentPage={0}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByText("第一章 开始")).toBeInTheDocument();
    expect(screen.getByText("第二章 中间")).toBeInTheDocument();
    expect(screen.getByText("第三章 结尾")).toBeInTheDocument();
  });

  it("calls onNavigate with the correct page index when heading is clicked", async () => {
    const onNavigate = vi.fn();
    // Use short pages so chapter 2 starts on page 1
    render(
      <TocSidebar
        content={CONTENT_WITH_CHAPTERS}
        currentPage={0}
        onNavigate={onNavigate}
        charsPerPage={20}
      />,
    );
    await userEvent.click(screen.getByText("第二章 中间"));
    expect(onNavigate).toHaveBeenCalledWith(expect.any(Number));
  });

  it("renders 'no chapters' message when content has no chapter headings", () => {
    render(
      <TocSidebar
        content="这是没有章节的纯文本内容"
        currentPage={0}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByText(/暂无目录/)).toBeInTheDocument();
  });

  it("marks the current chapter heading as active", () => {
    render(
      <TocSidebar
        content={CONTENT_WITH_CHAPTERS}
        currentPage={0}
        onNavigate={vi.fn()}
      />,
    );
    const firstChapter = screen.getByText("第一章 开始");
    expect(firstChapter.closest("button")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
