import { describe, expect, it } from "vitest";
import { useLogin, useRegister } from "./useAuth";

describe("useLogin and useRegister", () => {
  it("exports useLogin as a function", () => {
    expect(typeof useLogin).toBe("function");
  });
  it("exports useRegister as a function", () => {
    expect(typeof useRegister).toBe("function");
  });
});
