import { ApiError } from "@/api/client";
import { useUploadBook } from "@/api/hooks/useBooks";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

interface UploadModalProps {
  userId: string;
  onClose: () => void;
}

const MAX_SIZE_MB = 10;
const ACCEPTED_EXTS = [".txt", ".pdf", ".epub", ".mobi"];

export default function UploadModal({ userId, onClose }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadBook(userId);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("请选择文件");
      return;
    }
    const ext = `.${file.name.split(".").pop() ?? ""}`;
    if (!ACCEPTED_EXTS.includes(ext.toLowerCase())) {
      setError("仅支持 .txt、.pdf、.epub 或 .mobi 文件");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`文件不能超过 ${MAX_SIZE_MB}MB`);
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setError("文件读取失败，请重试");
        return;
      }
      const base64 = result.split(",")[1] ?? "";
      try {
        await uploadMutation.mutateAsync({
          filename: file.name,
          content: base64,
        });
        onClose();
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        setError(err.detail);
      }
    };
    reader.onerror = () => {
      setError("文件读取失败，请重试");
    };
  }

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 border-0 p-0 max-w-none w-full h-full"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2
          id="upload-modal-title"
          className="mb-4 text-lg font-semibold text-ink-dark"
        >
          上传书籍
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="book-file"
              className="block text-sm text-ink-dark/70"
            >
              选择文件{" "}
              <span className="text-ink-dark/40">
                （.txt、.pdf、.epub 或 .mobi，最大10MB）
              </span>
            </label>
            <input
              id="book-file"
              type="file"
              accept=".txt,.pdf,.epub,.mobi"
              ref={fileRef}
              className="mt-1 block w-full text-sm text-ink-dark/70 file:mr-3 file:rounded-lg file:border-0 file:bg-xuan-paper file:px-3 file:py-1.5 file:text-sm file:text-ink-dark"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-warm-red">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink-dark/20 px-4 py-2 text-sm text-ink-dark hover:bg-xuan-paper"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="rounded-lg bg-warm-red px-4 py-2 text-sm text-white hover:bg-warm-red/90 disabled:opacity-50"
            >
              {uploadMutation.isPending ? "上传中…" : "上传"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
