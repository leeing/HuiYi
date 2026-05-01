import type { ReaderPrefs } from "@/lib/readerPrefs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReaderPrefsPanel from "./ReaderPrefsPanel";

function makePrefs(overrides?: Partial<ReaderPrefs>): ReaderPrefs {
  return { fontSize: 18, theme: "light", ...overrides };
}

describe("ReaderPrefsPanel", () => {
  it("renders current font size", () => {
    render(
      <ReaderPrefsPanel
        prefs={makePrefs({ fontSize: 20 })}
        onPrefsChange={vi.fn()}
      />,
    );
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("calls onPrefsChange with increased fontSize when + clicked", async () => {
    const onPrefsChange = vi.fn();
    render(
      <ReaderPrefsPanel
        prefs={makePrefs({ fontSize: 18 })}
        onPrefsChange={onPrefsChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /增大字号/ }));
    expect(onPrefsChange).toHaveBeenCalledWith({
      fontSize: 20,
      theme: "light",
    });
  });

  it("calls onPrefsChange with decreased fontSize when − clicked", async () => {
    const onPrefsChange = vi.fn();
    render(
      <ReaderPrefsPanel
        prefs={makePrefs({ fontSize: 18 })}
        onPrefsChange={onPrefsChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /减小字号/ }));
    expect(onPrefsChange).toHaveBeenCalledWith({
      fontSize: 16,
      theme: "light",
    });
  });

  it("does not increase fontSize beyond 32", async () => {
    const onPrefsChange = vi.fn();
    render(
      <ReaderPrefsPanel
        prefs={makePrefs({ fontSize: 32 })}
        onPrefsChange={onPrefsChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /增大字号/ }));
    expect(onPrefsChange).not.toHaveBeenCalled();
  });

  it("does not decrease fontSize below 12", async () => {
    const onPrefsChange = vi.fn();
    render(
      <ReaderPrefsPanel
        prefs={makePrefs({ fontSize: 12 })}
        onPrefsChange={onPrefsChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /减小字号/ }));
    expect(onPrefsChange).not.toHaveBeenCalled();
  });

  it("calls onPrefsChange with new theme when theme button clicked", async () => {
    const onPrefsChange = vi.fn();
    render(
      <ReaderPrefsPanel
        prefs={makePrefs({ theme: "light" })}
        onPrefsChange={onPrefsChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /深色/ }));
    expect(onPrefsChange).toHaveBeenCalledWith({ fontSize: 18, theme: "dark" });
  });
});
