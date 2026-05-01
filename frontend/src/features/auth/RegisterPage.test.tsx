import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/AuthContext", () => ({
  useAuth: () => ({
    status: "anonymous",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import RegisterPage from "./RegisterPage";

function renderRegister() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RegisterPage", () => {
  it("renders username, password, and confirm password inputs", () => {
    renderRegister();
    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/用户名/i), "bob");
    await user.type(screen.getByLabelText(/^密码$/i), "abc123");
    await user.type(screen.getByLabelText(/确认密码/i), "abc456");
    await user.click(screen.getByRole("button", { name: /注册/i }));
    expect(await screen.findByText(/密码不一致/i)).toBeInTheDocument();
  });

  it("shows validation error when username is empty", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole("button", { name: /注册/i }));
    expect(await screen.findByText(/用户名不能为空/i)).toBeInTheDocument();
  });
});
