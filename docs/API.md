# 会意 API Reference

Base URL: `http://localhost:8000/api`

## Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/register` | `{username, password, signature?, avatar?}` | `{message, user_id, avatar, signature}` |
| POST | `/login` | `{username, password}` | `{message, user_id, avatar, signature}` |

## Books

| Method | Path | Params / Body | Response |
|--------|------|---------------|----------|
| GET | `/books` | `?user_id=` | `{books: [{id, title, author, progress}]}` |
| GET | `/book_content` | `?book_id=` | `{title, author, content}` |
| POST | `/upload` | `{user_id, filename, content (base64), author?}` | `{message, book_id}` |

## Users

| Method | Path | Params / Body | Response |
|--------|------|---------------|----------|
| GET | `/user_profile` | `?user_id=` | `{username, avatar, signature}` |
| GET | `/current_book` | `?user_id=` | `{book_id, title?, author?}` |
| POST | `/update_current_book` | `{user_id, book_id}` | `{success: true}` |

## Chat

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/chat` | `{message, user_id?, book_context?}` | `{response}` |

> **Note:** Authentication uses `user_id` passed in request body/params (session stored in localStorage).
> Token-based auth (JWT) is planned for a future iteration.
