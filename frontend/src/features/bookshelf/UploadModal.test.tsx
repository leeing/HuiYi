import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import UploadModal from "./UploadModal";

vi.mock("@/api/hooks/useBooks", () => ({
  useUploadBook: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ message: "ok", book_id: 1 }),
    isPending: false,
  }),
}));

function renderModal(onClose = vi.fn()) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <UploadModal
        userId="00000000-0000-0000-0000-000000000001"
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
}

describe("UploadModal", () => {
  it("renders the modal title", () => {
    renderModal();
    expect(screen.getByText(/上传书籍/i)).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal(onClose);
    await user.click(screen.getByRole("button", { name: /取消/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows validation error when no file selected and submit clicked", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: /^上传$/i }));
    expect(await screen.findByText(/请选择文件/i)).toBeInTheDocument();
  });
});
