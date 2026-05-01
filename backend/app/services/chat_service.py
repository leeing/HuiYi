import logging

import httpx
from sqlmodel import Session, col, select

from app.core.config import settings
from app.models.models import Book

logger = logging.getLogger("huiyi.chat")

_BASE_SYSTEM_PROMPT = (
    '你叫"会意"，是用户的知心阅读书友。'
    "你的回复要温暖、有深度、富有同理心。\n"
    "\n【核心原则】\n"
    "1. 如果用户问到他书架里有的书，请结合你对这本书的了解进行深度分析和讨论。\n"
    "2. 如果用户问到他书架里没有的书，请凭借你丰富的知识储备，"
    "详细介绍这本书的内容、作者背景、核心思想，并给出你的阅读感受和推荐理由。\n"
    "3. 你可以主动推荐相关书籍，帮助用户拓展阅读视野。\n"
    "4. 【语气基调】你是用户无话不谈的知心老友，语气要温柔、温暖、富有同理心。\n"
    "5. 【重要】绝对禁止使用括号来描写动作、神态、场景或补充评论。\n"
    "6. 引用书原文时，直接融入句子中，不要单独放在末尾的括号里。\n"
    "\n"
)

_DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
_MODEL = "qwen-flash-character"
_CONTEXT_MAX_CHARS = 5000


def build_system_prompt(
    books: list[tuple[str, str]],
    book_context: str,
) -> str:
    prompt = _BASE_SYSTEM_PROMPT

    if books:
        book_list = ", ".join(f"《{title}》({author})" for title, author in books)
        prompt += (
            f"\n\n你的用户目前藏书有：{book_list}。"
            "请在回答中适时关联这些书的内容，分析用户的阅读口味。"
        )

    if book_context:
        snippet = book_context[:_CONTEXT_MAX_CHARS]
        prompt += (
            f"\n\n用户正在阅读以下内容（节选）：\n{snippet}\n\n"
            "请结合这段内容回答用户的问题。"
        )
    else:
        prompt += "结合用户提到的书本内容进行回应。"

    return prompt


async def get_chat_response(
    message: str,
    user_id: str | None,
    book_context: str,
    session: Session,
) -> str:
    books: list[tuple[str, str]] = []
    if user_id:
        db_books = session.exec(
            select(Book)
            .where(Book.user_id == user_id)
            .order_by(col(Book.added_at).desc())
        ).all()
        books = [(b.title, b.author) for b in db_books]

    system_prompt = build_system_prompt(books=books, book_context=book_context)
    return await call_dashscope(message, system_prompt)


async def call_dashscope(message: str, system_prompt: str) -> str:
    if not settings.DASHSCOPE_API_KEY:
        return "AI 功能未配置（缺少 DASHSCOPE_API_KEY）"

    payload = {
        "model": _MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.DASHSCOPE_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(_DASHSCOPE_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return str(data["choices"][0]["message"]["content"])
    except httpx.HTTPStatusError as exc:
        logger.error("DashScope HTTP error status=%s", exc.response.status_code)
        return f"AI 服务异常: {exc.response.status_code}"
    except (KeyError, IndexError):
        logger.error("DashScope unexpected response structure")
        return "AI 返回结构异常"
    except httpx.RequestError as exc:
        logger.error("DashScope connection error: %s", exc)
        return "AI 连接中断"
