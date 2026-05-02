import { useBooks } from "@/api/hooks/useBooks";
import { useAuth } from "@/app/AuthContext";
import { useState } from "react";
import BookCard from "./BookCard";
import UploadModal from "./UploadModal";

export default function BookshelfPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.userId : "";
  const username = auth.status === "authenticated" ? auth.username : "";
  const logout = auth.logout;

  const { data, isLoading, isError } = useBooks(userId);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen bg-xuan-paper">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-ink-dark/10 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-ink-dark">会意 · 书架</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-dark/60">{username}</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-ink-dark/50 hover:text-warm-red"
          >
            退出
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg text-ink-dark/80">我的书籍</h2>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-warm-red px-4 py-2 text-sm text-white hover:bg-warm-red/90"
          >
            + 上传
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <span className="text-ink-dark/40">加载中…</span>
          </div>
        )}

        {isError && (
          <div className="flex justify-center py-16">
            <span className="text-warm-red">加载失败，请刷新重试</span>
          </div>
        )}

        {!isLoading &&
          !isError &&
          data &&
          (data.books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-4xl">📚</p>
              <p className="mt-4 text-ink-dark/50">书架还是空的</p>
              <p className="mt-1 text-sm text-ink-dark/30">
                上传你的第一本书吧
              </p>
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="mt-6 rounded-lg bg-warm-red px-6 py-2 text-sm text-white hover:bg-warm-red/90"
              >
                上传书籍
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ))}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal userId={userId} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}
