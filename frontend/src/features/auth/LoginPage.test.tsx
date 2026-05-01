import { server } from "@/test/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/AuthContext", () => ({
  useAuth: () => ({
    status: "anonymous",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import LoginPage from "./LoginPage";

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  it("renders username and password inputs", () => {
    renderLogin();
    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
  });

  it("shows validation error when submitted empty", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: /登录/i }));
    expect(await screen.findByText(/用户名不能为空/i)).toBeInTheDocument();
  });

  it("calls login API and succeeds", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/用户名/i), "alice");
    await user.type(screen.getByLabelText(/密码/i), "secret");
    await user.click(screen.getByRole("button", { name: /登录/i }));
    // Wait for the mutation to settle; no error alert should appear after success
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows error message on API failure", async () => {
    server.use(
      http.post("/api/login", () =>
        Response.json({ detail: "密码错误" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/用户名/i), "alice");
    await user.type(screen.getByLabelText(/密码/i), "wrong");
    await user.click(screen.getByRole("button", { name: /登录/i }));
    expect(await screen.findByText(/密码错误/i)).toBeInTheDocument();
  });
});
