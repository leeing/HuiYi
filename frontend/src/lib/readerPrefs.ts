import { z } from "zod";

export const READER_THEMES = ["light", "sepia", "dark"] as const;
export type ReaderTheme = (typeof READER_THEMES)[number];

const ReaderPrefsSchema = z.object({
  fontSize: z
    .number()
    .int()
    .min(12)
    .max(32)
    .describe("Font size in pixels (12–32)"),
  theme: z
    .enum(READER_THEMES)
    .describe("Reader background theme: light, sepia, or dark"),
});

export type ReaderPrefs = z.infer<typeof ReaderPrefsSchema>;

export const DEFAULT_PREFS: ReaderPrefs = {
  fontSize: 18,
  theme: "light",
};

const STORAGE_KEY = "huiyi_reader_prefs";

export function loadPrefs(): ReaderPrefs {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    return ReaderPrefsSchema.parse(JSON.parse(raw));
  } catch (err) {
    if (!(err instanceof SyntaxError) && !(err instanceof z.ZodError))
      throw err;
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: ReaderPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
