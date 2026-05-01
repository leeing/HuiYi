import type { ReaderPrefs, ReaderTheme } from "@/lib/readerPrefs";

interface ReaderPrefsPanelProps {
  prefs: ReaderPrefs;
  onPrefsChange: (next: ReaderPrefs) => void;
}

const THEME_LABELS: Record<ReaderTheme, string> = {
  light: "白天",
  sepia: "护眼",
  dark: "深色",
};

const THEME_STYLES: Record<ReaderTheme, string> = {
  light: "bg-white text-ink-dark",
  sepia: "bg-amber-50 text-amber-900",
  dark: "bg-zinc-800 text-zinc-100",
};

export default function ReaderPrefsPanel({
  prefs,
  onPrefsChange,
}: ReaderPrefsPanelProps) {
  const { fontSize, theme } = prefs;

  function changeFont(delta: number) {
    const next = fontSize + delta;
    if (next < 12 || next > 32) return;
    onPrefsChange({ fontSize: next, theme });
  }

  function changeTheme(next: ReaderTheme) {
    onPrefsChange({ fontSize, theme: next });
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-ink-dark/10 bg-white p-4 shadow-lg">
      <legend className="sr-only">阅读设置</legend>
      {/* Font size */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-dark/60">字号</span>
        <button
          type="button"
          aria-label="减小字号"
          onClick={() => changeFont(-2)}
          disabled={fontSize <= 12}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-dark/20 text-ink-dark/70 hover:bg-ink-dark/5 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium text-ink-dark">
          {fontSize}
        </span>
        <button
          type="button"
          aria-label="增大字号"
          onClick={() => changeFont(2)}
          disabled={fontSize >= 32}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-dark/20 text-ink-dark/70 hover:bg-ink-dark/5 disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* Theme */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-dark/60">背景</span>
        {(["light", "sepia", "dark"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-label={THEME_LABELS[t]}
            aria-pressed={theme === t}
            onClick={() => changeTheme(t)}
            className={`rounded-lg border px-3 py-1 text-xs ${THEME_STYLES[t]} ${theme === t ? "ring-2 ring-warm-red" : "border-ink-dark/20"}`}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
