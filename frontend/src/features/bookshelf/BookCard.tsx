import type { Book } from "@/api/types";
import { bookGradient } from "@/lib/bookGradient";
import { Link } from "react-router-dom";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const gradient = bookGradient(book.title);

  return (
    <Link
      to={`/reader/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-xl shadow-sm transition hover:shadow-md"
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
  );
}
