import { useChat } from "@/api/hooks/useChat";
import { useEffect } from "react";

interface AiOverlayProps {
  selectedText: string;
  bookContext: string;
  onClose: () => void;
}

export default function AiOverlay({
  selectedText,
  bookContext,
  onClose,
}: AiOverlayProps) {
  const { mutate, data, isPending, isError } = useChat();

  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once on mount
  useEffect(() => {
    mutate({
      message: `请解释这段文字的含义：${selectedText}`,
      book_context: bookContext,
    });
  }, []);

  return (
    <dialog
      open
      aria-labelledby="ai-overlay-title"
      className="fixed inset-0 z-50 m-auto h-fit max-h-[60vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink-dark/10 bg-white p-6 shadow-2xl"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2
          id="ai-overlay-title"
          className="text-sm font-semibold text-ink-dark"
        >
          AI 解读
        </h2>
        <button
          type="button"
          aria-label="关闭"
          onClick={onClose}
          className="text-ink-dark/40 hover:text-ink-dark"
        >
          ✕
        </button>
      </div>

      <blockquote className="mb-4 rounded-lg bg-ink-dark/5 px-4 py-3 text-sm italic text-ink-dark/70">
        {selectedText}
      </blockquote>

      {isPending && <p className="text-sm text-ink-dark/40">AI 思考中…</p>}
      {isError && (
        <p className="text-sm text-warm-red">无法连接 AI，请稍后重试</p>
      )}
      {data && (
        <p className="text-sm leading-relaxed text-ink-dark">{data.response}</p>
      )}
    </dialog>
  );
}
