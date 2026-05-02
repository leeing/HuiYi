import { apiClient } from "@/api/client";
import type { BooksResponse, UploadRequest, UploadResponse } from "@/api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const BOOKS_QUERY_KEY = (userId: string) => ["books", userId] as const;

export function useBooks(userId: string) {
  return useQuery({
    queryKey: BOOKS_QUERY_KEY(userId),
    queryFn: () => apiClient<BooksResponse>(`/books?user_id=${userId}`),
    enabled: userId.length > 0,
  });
}

export function useUploadBook(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<UploadRequest, "user_id">) =>
      apiClient<UploadResponse>("/upload", {
        method: "POST",
        body: JSON.stringify({ ...payload, user_id: userId }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY(userId) });
    },
  });
}
