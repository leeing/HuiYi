import { apiClient } from "@/api/client";
import type {
  BookMetadataResponse,
  BookUpdateRequest,
  BooksResponse,
  UploadRequest,
  UploadResponse,
} from "@/api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const BOOKS_QUERY_KEY = (userId: string) => ["books", userId] as const;
export const BOOK_METADATA_KEY = (bookId: string) =>
  ["book-metadata", bookId] as const;

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

export function useBookMetadata(bookId: string) {
  return useQuery({
    queryKey: BOOK_METADATA_KEY(bookId),
    queryFn: () => apiClient<BookMetadataResponse>(`/book_metadata/${bookId}`),
    enabled: bookId.length > 0,
  });
}

export function useUpdateBook(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookId,
      payload,
    }: {
      bookId: string;
      payload: BookUpdateRequest;
    }) =>
      apiClient<{ message: string }>(`/book/${bookId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY(userId) });
      void queryClient.invalidateQueries({
        queryKey: BOOK_METADATA_KEY(variables.bookId),
      });
    },
  });
}

export function useDeleteBook(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) =>
      apiClient<{ message: string }>(`/book/${bookId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY(userId) });
    },
  });
}

export function useDownloadBook() {
  return (bookId: string) => {
    window.open(`/api/book/${bookId}/download`, "_blank");
  };
}
