import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient } from "./client";

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "ok" }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prepends /api to the path", async () => {
    await apiClient("/login", { method: "POST", body: JSON.stringify({}) });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sets Content-Type: application/json", async () => {
    await apiClient("/login", { method: "POST" });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("returns parsed JSON on success", async () => {
    const result = await apiClient<{ message: string }>("/login", {
      method: "POST",
    });
    expect(result.message).toBe("ok");
  });

  it("throws ApiError on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Unauthorized" }),
      }),
    );
    await expect(apiClient("/login", { method: "POST" })).rejects.toThrow(
      ApiError,
    );
  });
});
