from app.services.chat_service import build_system_prompt

BOOKS = [("红楼梦", "曹雪芹"), ("长安的荔枝", "马伯庸")]


def test_build_system_prompt_contains_base() -> None:
    prompt = build_system_prompt(books=[], book_context="")
    assert "会意" in prompt


def test_build_system_prompt_includes_book_list() -> None:
    prompt = build_system_prompt(books=BOOKS, book_context="")
    assert "红楼梦" in prompt
    assert "曹雪芹" in prompt


def test_build_system_prompt_includes_book_context() -> None:
    ctx = "宝玉见黛玉哭泣，心中难受。"
    prompt = build_system_prompt(books=[], book_context=ctx)
    assert ctx in prompt


def test_build_system_prompt_truncates_long_context() -> None:
    long_ctx = "x" * 10000
    prompt = build_system_prompt(books=[], book_context=long_ctx)
    # context is capped at 5000 chars
    assert len(prompt) < 8000
