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
  http.get("/api/book_content", () =>
    Response.json({
      title: "测试书籍",
      author: "测试作者",
      content:
        "第一章 开始\n\n这是第一章的内容，用于测试阅读器分页功能。\n\n第二章 中间\n\n这是第二章的内容，继续测试。",
    }),
  ),
  http.post("/api/chat", () =>
    Response.json({ response: "这是一个测试 AI 回复。" }),
  ),
  http.post("/api/update_current_book", () =>
    Response.json({ success: true }),
  ),
];
