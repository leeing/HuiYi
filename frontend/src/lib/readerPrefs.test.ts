import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_PREFS, loadPrefs, savePrefs } from "./readerPrefs";

afterEach(() => {
  localStorage.clear();
});

describe("readerPrefs", () => {
  it("returns defaults when nothing is stored", () => {
    const prefs = loadPrefs();
    expect(prefs).toEqual(DEFAULT_PREFS);
  });

  it("saves and loads prefs correctly", () => {
    savePrefs({ fontSize: 20, theme: "dark" });
    const prefs = loadPrefs();
    expect(prefs.fontSize).toBe(20);
    expect(prefs.theme).toBe("dark");
  });

  it("returns defaults on corrupt JSON", () => {
    localStorage.setItem("huiyi_reader_prefs", "not-json");
    const prefs = loadPrefs();
    expect(prefs).toEqual(DEFAULT_PREFS);
  });

  it("returns defaults when stored value fails schema", () => {
    localStorage.setItem(
      "huiyi_reader_prefs",
      JSON.stringify({ fontSize: "big", theme: "invalid" }),
    );
    const prefs = loadPrefs();
    expect(prefs).toEqual(DEFAULT_PREFS);
  });

  it("accepts sepia theme", () => {
    savePrefs({ fontSize: 16, theme: "sepia" });
    expect(loadPrefs().theme).toBe("sepia");
  });
});
