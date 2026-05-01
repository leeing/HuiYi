import { useBookContent, useUpdateCurrentBook } from "@/api/hooks/useReader";
import { AuthContext } from "@/app/AuthContext";
import { paginate } from "@/lib/paginate";
import type { ReaderTheme } from "@/lib/readerPrefs";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AiOverlay from "./AiOverlay";
import ReaderContent from "./ReaderContent";
import ReaderPrefsPanel from "./ReaderPrefsPanel";
import SelectionMenu from "./SelectionMenu";
import TocSidebar from "./TocSidebar";
import { useReaderPrefs } from "./useReaderPrefs";

const CHARS_PER_PAGE = 800;

const THEME_BG: Record<ReaderTheme, string> = {
  light: "bg-white",
  sepia: "bg-amber-50",
  dark: "bg-zinc-800",
};

interface SelectionState {
  text: string;
  x: number;
  y: number;
}

export default function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const rawId = Number(bookId ?? "0");
  const bookIdNum = Number.isNaN(rawId) ? 0 : rawId;

  const authCtx = useContext(AuthContext);
  const userId = authCtx?.status === "authenticated" ? authCtx.userId : 0;

  const { data, isLoading, isError } = useBookContent(bookIdNum);
  const { mutate: updateCurrentBook } = useUpdateCurrentBook();

  const [currentPage, setCurrentPage] = useState(0);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const { prefs, setPrefs } = useReaderPrefs();
  const content = data?.content ?? "";

  useEffect(() => {
    if (!bookIdNum || !userId || !content) return;
    const totalPages = paginate(content, CHARS_PER_PAGE).length;
    const progress =
      totalPages > 1 ? Math.round((currentPage / (totalPages - 1)) * 100) : 100;
    updateCurrentBook({ user_id: userId, book_id: bookIdNum });
    // progress is computed but API doesn't accept it yet
    void progress;
  }, [currentPage, bookIdNum, userId, content, updateCurrentBook]);

  const handleSelectionChange = useCallback(
    (text: string, x: number, y: number) => {
      if (text) setSelection({ text, x, y });
      else setSelection(null);
    },
    [],
  );

  const handleAiAssist = useCallback((text: string) => {
    setAiText(text);
    setSelection(null);
  }, []);

  const themeBg = THEME_BG[prefs.theme];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-xuan-paper">
        <span className="text-ink-dark/50">加载中…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-xuan-paper">
        <span className="text-warm-red">加载失败，请返回书架重试</span>
      </div>
    );
  }

  return (
    <div className={`flex h-screen flex-col ${themeBg}`}>
      <header className="flex items-center justify-between border-b border-ink-dark/10 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-ink-dark/50 hover:text-ink-dark"
            aria-label="返回书架"
          >
            ← 书架
          </Link>
          <span className="text-ink-dark/20">|</span>
          <h1 className="text-sm font-medium text-ink-dark">{data.title}</h1>
        </div>
        <button
          type="button"
          aria-label="设置"
          aria-expanded={showPrefs}
          onClick={() => setShowPrefs((v) => !v)}
          className="text-sm text-ink-dark/50 hover:text-ink-dark"
        >
          ⚙ 设置
        </button>
      </header>

      {showPrefs && (
        <div className="border-b border-ink-dark/10 px-6 py-3">
          <ReaderPrefsPanel prefs={prefs} onPrefsChange={setPrefs} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-ink-dark/10">
          <TocSidebar
            content={content}
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            charsPerPage={CHARS_PER_PAGE}
          />
        </aside>

        <main className="flex-1 overflow-hidden">
          <ReaderContent
            content={content}
            currentPage={currentPage}
            fontSize={prefs.fontSize}
            onPageChange={setCurrentPage}
            onSelectionChange={handleSelectionChange}
            charsPerPage={CHARS_PER_PAGE}
          />
        </main>
      </div>

      {selection !== null && (
        <SelectionMenu
          selectedText={selection.text}
          position={{ x: selection.x, y: selection.y }}
          onAiAssist={handleAiAssist}
          onClose={() => setSelection(null)}
        />
      )}

      {aiText !== null && (
        <AiOverlay
          selectedText={aiText}
          bookContext={data.title}
          onClose={() => setAiText(null)}
        />
      )}
    </div>
  );
}
