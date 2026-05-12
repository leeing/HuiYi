export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  signature?: string;
  avatar?: string;
}

export interface AuthResponse {
  message: string;
  user_id: string;
  avatar: string;
  signature: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  progress: number;
  file_type?: string;
  file_size?: number;
}

export interface BooksResponse {
  books: Book[];
}

export interface BookContentResponse {
  title: string;
  author: string;
  content: string;
  file_type?: string;
}

export interface UploadRequest {
  user_id: string;
  filename: string;
  content: string; // base64
  author?: string;
}

export interface UploadResponse {
  message: string;
  book_id: string;
}

export interface UserProfile {
  username: string;
  avatar: string;
  signature: string;
}

export interface CurrentBookResponse {
  book_id: string | null;
  title?: string;
  author?: string;
}

export interface UpdateCurrentBookRequest {
  user_id: string;
  book_id: string;
  progress?: number;
}

export interface UpdateCurrentBookResponse {
  success: true;
}

export interface ChatRequest {
  message: string;
  user_id?: string;
  book_context?: string;
}

export interface ChatResponse {
  response: string;
}

export interface BookMetadataResponse {
  book_id: string;
  title: string;
  author: string;
  file_type: string;
  file_size: number;
  metadata?: Record<string, unknown>;
}

export interface BookUpdateRequest {
  title?: string;
  author?: string;
}
