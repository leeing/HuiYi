import { apiClient } from "@/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/api/types";
import { useMutation } from "@tanstack/react-query";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      apiClient<AuthResponse>("/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      apiClient<AuthResponse>("/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
