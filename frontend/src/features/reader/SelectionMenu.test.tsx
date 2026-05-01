import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SelectionMenu from "./SelectionMenu";

describe("SelectionMenu", () => {
  it("is not visible when selectedText is empty", () => {
    render(
      <SelectionMenu
        selectedText=""
        position={{ x: 0, y: 0 }}
        onAiAssist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows the AI assist button when selectedText is non-empty", () => {
    render(
      <SelectionMenu
        selectedText="一些文字"
        position={{ x: 100, y: 200 }}
        onAiAssist={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /AI 解读/ }),
    ).toBeInTheDocument();
  });

  it("calls onAiAssist with selectedText when AI button is clicked", async () => {
    const onAiAssist = vi.fn();
    render(
      <SelectionMenu
        selectedText="选中的内容"
        position={{ x: 0, y: 0 }}
        onAiAssist={onAiAssist}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("menuitem", { name: /AI 解读/ }));
    expect(onAiAssist).toHaveBeenCalledWith("选中的内容");
  });
});
