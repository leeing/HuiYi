import {
  useDeleteBook,
  useDownloadBook,
  useUpdateBook,
} from "@/api/hooks/useBooks";
import type { Book } from "@/api/types";
import { bookGradient } from "@/lib/bookGradient";
import { useState } from "react";
import { Link } from "react-router-dom";

interface BookCardProps {
  book: Book;
  userId: string;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  txt: "TXT",
  pdf: "PDF",
  epub: "EPUB",
  mobi: "MOBI",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BookCard({ book, userId }: BookCardProps) {
  const gradient = bookGradient(book.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author);

  const updateMutation = useUpdateBook(userId);
  const deleteMutation = useDeleteBook(userId);
  const downloadBook = useDownloadBook();

  function handleMenuClick(action: string) {
    setMenuOpen(false);
    if (action === "download") {
      downloadBook(book.id);
    } else if (action === "rename") {
      setEditTitle(book.title);
      setEditAuthor(book.author);
      setEditMode(true);
    } else if (action === "delete") {
      if (window.confirm(`确定要删除《${book.title}》吗？`)) {
        void deleteMutation.mutateAsync(book.id);
      }
    }
  }

  async function handleSaveEdit() {
    await updateMutation.mutateAsync({
      bookId: book.id,
      payload: { title: editTitle, author: editAuthor },
    });
    setEditMode(false);
  }

  if (editMode) {
    return (
      <div className="flex flex-col overflow-hidden rounded-xl shadow-sm bg-white p-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="text-sm font-medium text-ink-dark border rounded px-2 py-1 mb-2"
          placeholder="书名"
        />
        <input
          type="text"
          value={editAuthor}
          onChange={(e) => setEditAuthor(e.target.value)}
          className="text-xs text-ink-dark/70 border rounded px-2 py-1 mb-2"
          placeholder="作者"
        />
        <div className="flex gap-2 mt-auto">
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="flex-1 rounded-lg border border-ink-dark/20 px-3 py-1.5 text-xs text-ink-dark hover:bg-xuan-paper"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={updateMutation.isPending}
            className="flex-1 rounded-lg bg-warm-red px-3 py-1.5 text-xs text-white hover:bg-warm-red/90 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl shadow-sm transition hover:shadow-md">
      <Link
        to={`/reader/${book.id}`}
        className="flex flex-col"
        aria-label={`阅读《${book.title}》`}
      >
        {/* Cover */}
        <div
          className="h-40 w-full"
          style={{ background: gradient }}
          aria-hidden="true"
        />

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1 bg-white p-3">
          <p className="line-clamp-2 text-sm font-medium text-ink-dark">
            {book.title}
          </p>
          <p className="text-xs text-ink-dark/50">{book.author}</p>
          <div className="mt-auto pt-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-ink-dark/10">
              <div
                className="h-full rounded-full bg-warm-red/70"
                style={{ width: `${book.progress}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-ink-dark/40">
              {book.progress}%
            </p>
          </div>
        </div>
      </Link>

      {/* File type badge */}
      {book.file_type && (
        <div className="absolute top-2 right-2">
          <span className="rounded bg-ink-dark/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {FILE_TYPE_LABELS[book.file_type] ?? book.file_type.toUpperCase()}
          </span>
        </div>
      )}

      {/* Menu button */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(!menuOpen);
          }}
          className="rounded bg-white/90 p-1 shadow hover:bg-white"
          aria-label="更多操作"
        >
          <svg
            className="h-4 w-4 text-ink-dark"
            fill="currentColor"
            viewBox="0 0 24 24"
            role="img"
            aria-label="菜单"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 mt-1 w-28 rounded-lg bg-white shadow-lg border border-ink-dark/10 py-1 z-10">
            <button
              type="button"
              onClick={() => handleMenuClick("download")}
              className="w-full px-3 py-1.5 text-left text-xs text-ink-dark hover:bg-xuan-paper"
            >
              下载
            </button>
            <button
              type="button"
              onClick={() => handleMenuClick("rename")}
              className="w-full px-3 py-1.5 text-left text-xs text-ink-dark hover:bg-xuan-paper"
            >
              重命名
            </button>
            <button
              type="button"
              onClick={() => handleMenuClick("delete")}
              className="w-full px-3 py-1.5 text-left text-xs text-warm-red hover:bg-warm-red/10"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {/* File size */}
      {book.file_size != null && book.file_size > 0 && (
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] text-ink-dark/40">
            {formatFileSize(book.file_size)}
          </span>
        </div>
      )}
    </div>
  );
}
