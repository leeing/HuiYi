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
  user_id: number;
  avatar: string;
  signature: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  progress: number;
}

export interface BooksResponse {
  books: Book[];
}

export interface BookContentResponse {
  title: string;
  author: string;
  content: string;
}

export interface UploadRequest {
  user_id: number;
  filename: string;
  content: string; // base64
  author?: string;
}

export interface UploadResponse {
  message: string;
  book_id: number;
}

export interface UserProfile {
  username: string;
  avatar: string;
  signature: string;
}

export interface CurrentBookResponse {
  book_id: number | null;
  title?: string;
  author?: string;
}

export interface UpdateCurrentBookRequest {
  user_id: number;
  book_id: number;
  progress?: number;
}

export interface UpdateCurrentBookResponse {
  success: true;
}

export interface ChatRequest {
  message: string;
  user_id?: number;
  book_context?: string;
}

export interface ChatResponse {
  response: string;
}
