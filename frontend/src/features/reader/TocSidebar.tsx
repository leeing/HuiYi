import { paginate } from "@/lib/paginate";
import { useMemo } from "react";

const DEFAULT_CHARS_PER_PAGE = 800;

// Matches lines like "第一章 ...", "第二章...", "Chapter 1 ...", "Chapter N ..."
const CHAPTER_HEADING_RE =
  /^(第[一二三四五六七八九十百千\d]+章[^\n]*|Chapter\s+\d+[^\n]*)/;

interface TocEntry {
  title: string;
  pageIndex: number;
}

interface TocSidebarProps {
  content: string;
  currentPage: number;
  onNavigate: (pageIndex: number) => void;
  charsPerPage?: number;
}

function extractToc(content: string, charsPerPage: number): TocEntry[] {
  const pages = paginate(content, charsPerPage);
  const entries: TocEntry[] = [];

  // Build a map from char offset to page index
  const pageStartOffsets: number[] = [];
  let offset = 0;
  for (const page of pages) {
    pageStartOffsets.push(offset);
    offset += page.length;
  }

  // Scan all lines for chapter headings
  const lines = content.split("\n");
  let charPos = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (CHAPTER_HEADING_RE.test(trimmed)) {
      // Find which page this character position falls on
      let pageIndex = 0;
      for (let i = 0; i < pageStartOffsets.length; i++) {
        const start = pageStartOffsets[i];
        if (start !== undefined && start <= charPos) pageIndex = i;
      }
      entries.push({ title: trimmed, pageIndex });
    }
    charPos += line.length + 1; // +1 for the "\n"
  }

  return entries;
}

export default function TocSidebar({
  content,
  currentPage,
  onNavigate,
  charsPerPage = DEFAULT_CHARS_PER_PAGE,
}: TocSidebarProps) {
  const toc = useMemo(
    () => extractToc(content, charsPerPage),
    [content, charsPerPage],
  );

  // Determine which chapter is currently active: the first chapter on the
  // highest page number that is still <= currentPage.
  const activeIndex = useMemo(() => {
    let active = 0;
    let activePageIndex = -1;
    for (let i = 0; i < toc.length; i++) {
      const entry = toc[i];
      if (
        entry !== undefined &&
        entry.pageIndex <= currentPage &&
        entry.pageIndex > activePageIndex
      ) {
        active = i;
        activePageIndex = entry.pageIndex;
      }
    }
    return active;
  }, [toc, currentPage]);

  return (
    <nav
      aria-label="目录"
      className="flex h-full flex-col overflow-y-auto border-r border-ink-dark/10 bg-white"
    >
      <div className="border-b border-ink-dark/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink-dark">目录</h2>
      </div>

      {toc.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-dark/40">暂无目录</p>
      ) : (
        <ul className="flex flex-col py-2">
          {toc.map((entry, i) => (
            <li key={entry.title}>
              <button
                type="button"
                aria-current={i === activeIndex ? "true" : undefined}
                onClick={() => onNavigate(entry.pageIndex)}
                className={`w-full px-4 py-2 text-left text-sm transition hover:bg-ink-dark/5 ${
                  i === activeIndex
                    ? "font-medium text-warm-red"
                    : "text-ink-dark/70"
                }`}
              >
                {entry.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
