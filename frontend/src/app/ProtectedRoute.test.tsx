import { render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// Mock AuthContext so we can control auth state
vi.mock("./AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { useAuth } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

describe("ProtectedRoute", () => {
  it("renders children when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      userId: "00000000-0000-0000-0000-000000000001",
      username: "test",
      avatar: "",
      signature: "",
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects to /login when anonymous", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "anonymous",
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows loading spinner when status is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "loading",
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/加载中/)).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
