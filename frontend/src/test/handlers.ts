import { http } from "msw";

export const handlers = [
  http.post("/api/login", () =>
    Response.json({
      message: "ok",
      user_id: 1,
      avatar: "",
      signature: "",
    }),
  ),
  http.post("/api/register", () =>
    Response.json({
      message: "ok",
      user_id: 1,
      avatar: "",
      signature: "",
    }),
  ),
  http.get("/api/books", () =>
    Response.json({
      books: [{ id: 1, title: "测试书籍", author: "测试作者", progress: 0 }],
    }),
  ),
  http.post("/api/upload", () => Response.json({ message: "ok", book_id: 1 })),
  http.get("/api/user_profile", () =>
    Response.json({ username: "test", avatar: "", signature: "" }),
  ),
  http.get("/api/current_book", () => Response.json({ book_id: null })),
];
