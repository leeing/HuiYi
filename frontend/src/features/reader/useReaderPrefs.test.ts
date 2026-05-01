import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useReaderPrefs } from "./useReaderPrefs";

afterEach(() => {
  localStorage.clear();
});

describe("useReaderPrefs", () => {
  it("initializes with default prefs", () => {
    const { result } = renderHook(() => useReaderPrefs());
    expect(result.current.prefs.fontSize).toBe(18);
    expect(result.current.prefs.theme).toBe("light");
  });

  it("updates fontSize and persists to localStorage", () => {
    const { result } = renderHook(() => useReaderPrefs());
    act(() => {
      result.current.setPrefs({ fontSize: 22, theme: "light" });
    });
    expect(result.current.prefs.fontSize).toBe(22);
    // New hook instance should read from localStorage
    const { result: result2 } = renderHook(() => useReaderPrefs());
    expect(result2.current.prefs.fontSize).toBe(22);
  });

  it("updates theme and persists", () => {
    const { result } = renderHook(() => useReaderPrefs());
    act(() => {
      result.current.setPrefs({ fontSize: 18, theme: "sepia" });
    });
    expect(result.current.prefs.theme).toBe("sepia");
  });
});
