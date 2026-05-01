import { apiClient } from "@/api/client";
import type { ChatRequest, ChatResponse } from "@/api/types";
import { useMutation } from "@tanstack/react-query";

export function useChat() {
  return useMutation({
    mutationFn: (payload: ChatRequest) =>
      apiClient<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
