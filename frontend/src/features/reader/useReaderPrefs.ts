import { loadPrefs, savePrefs } from "@/lib/readerPrefs";
import type { ReaderPrefs } from "@/lib/readerPrefs";
import { useCallback, useState } from "react";

export function useReaderPrefs() {
  const [prefs, setPrefsState] = useState<ReaderPrefs>(() => loadPrefs());

  const setPrefs = useCallback((next: ReaderPrefs) => {
    savePrefs(next);
    setPrefsState(next);
  }, []);

  return { prefs, setPrefs };
}
