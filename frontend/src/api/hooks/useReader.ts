import { apiClient } from "@/api/client";
import type {
  BookContentResponse,
  UpdateCurrentBookRequest,
  UpdateCurrentBookResponse,
} from "@/api/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const BOOK_CONTENT_QUERY_KEY = (bookId: number) =>
  ["book_content", bookId] as const;

export function useBookContent(bookId: number) {
  return useQuery({
    queryKey: BOOK_CONTENT_QUERY_KEY(bookId),
    queryFn: () =>
      apiClient<BookContentResponse>(`/book_content?book_id=${bookId}`),
    enabled: bookId > 0,
  });
}

export function useUpdateCurrentBook() {
  return useMutation({
    mutationFn: (payload: UpdateCurrentBookRequest) =>
      apiClient<UpdateCurrentBookResponse>("/update_current_book", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
