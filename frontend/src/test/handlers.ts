import * as msw from "msw";

export const handlers = [
  msw.http.post("/api/login", () =>
    msw.HttpResponse.json({
      message: "ok",
      user_id: 1,
      avatar: "",
      signature: "",
    }),
  ),
  msw.http.post("/api/register", () =>
    msw.HttpResponse.json({
      message: "ok",
      user_id: 1,
      avatar: "",
      signature: "",
    }),
  ),
  msw.http.get("/api/books", () =>
    msw.HttpResponse.json({
      books: [{ id: 1, title: "测试书籍", author: "测试作者", progress: 0 }],
    }),
  ),
  msw.http.post("/api/upload", () =>
    msw.HttpResponse.json({ message: "ok", book_id: 1 }),
  ),
  msw.http.get("/api/user_profile", () =>
    msw.HttpResponse.json({ username: "test", avatar: "", signature: "" }),
  ),
  msw.http.get("/api/current_book", () =>
    msw.HttpResponse.json({ book_id: null }),
  ),
];
