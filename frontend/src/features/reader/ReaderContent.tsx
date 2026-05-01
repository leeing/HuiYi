import { paginate } from "@/lib/paginate";
import { useCallback, useMemo } from "react";

const DEFAULT_CHARS_PER_PAGE = 800;

interface ReaderContentProps {
  content: string;
  currentPage: number;
  fontSize: number;
  onPageChange: (page: number) => void;
  onSelectionChange: (text: string, x: number, y: number) => void;
  charsPerPage?: number;
}

export default function ReaderContent({
  content,
  currentPage,
  fontSize,
  onPageChange,
  onSelectionChange,
  charsPerPage = DEFAULT_CHARS_PER_PAGE,
}: ReaderContentProps) {
  const pages = useMemo(
    () => paginate(content, charsPerPage),
    [content, charsPerPage],
  );
  const totalPages = pages.length;
  const pageText = pages[currentPage] ?? "";

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!text) return;
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    onSelectionChange(text, rect?.left ?? 0, (rect?.top ?? 0) - 40);
  }, [onSelectionChange]);

  return (
    <div className="flex h-full flex-col">
      {/* Text area */}
      <div
        className="flex-1 overflow-y-auto px-8 py-6 leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
        onMouseUp={handleMouseUp}
      >
        <p className="whitespace-pre-wrap text-ink-dark">{pageText}</p>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-6 border-t border-ink-dark/10 py-3">
        <button
          type="button"
          aria-label="上一页"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          className="rounded-lg px-4 py-1.5 text-sm text-ink-dark/60 hover:bg-ink-dark/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← 上一页
        </button>

        <span className="text-sm text-ink-dark/40">
          {currentPage + 1} / {totalPages}
        </span>

        <button
          type="button"
          aria-label="下一页"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="rounded-lg px-4 py-1.5 text-sm text-ink-dark/60 hover:bg-ink-dark/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          下一页 →
        </button>
      </div>
    </div>
  );
}
