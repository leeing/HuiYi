# 🏮 会意 (Huiyi)

> **懂书也懂你的 AI 阅读伴侣**

会意是一款融合沉浸式阅读与 AI 深度互动的智能阅读应用。东方美学设计风格，以宣纸质感为底色，让每一次阅读都有温度。

---

## ✨ 当前功能

### 📚 书架
- 支持上传 TXT 格式书籍，内置《红楼梦》《生育制度》《长安的荔枝》《基层女性》等经典书目
- 根据书名哈希自动生成独特渐变色封面
- 实时记录阅读进度（百分比）

### 📖 沉浸式阅读器
- 仿真分页显示（每页 800 字），支持键盘 / 点击翻页
- 三种阅读主题：羊皮纸 / 护眼 / 夜间
- 字号无级调节，偏好本地记忆
- 自动识别章节标题，生成侧边栏目录

### 🤖 AI 伴读「会意」
- 划选任意文字即可唤起 AI 浮层，进行深度解读与赏析
- AI 自动关联当前书籍内容与用户书架，提供个性化回应
- 基于阿里云 `qwen-flash-character` 模型驱动

### 👤 用户系统
- 用户名 + 密码注册登录
- 个人资料：5 款手绘风格头像 + 个性签名

---

## 🏗️ 技术架构

本项目经历了一次完整的技术栈升级，从原型阶段的零依赖实现演进为生产级全栈架构。

### 原始架构（原型阶段）

```
原生 HTML + Tailwind CSS + 原生 JS
       │ REST JSON API
       ▼
Python 标准库 http.server
  └── SQLite
  └── DashScope API（AI 对话）
```

特点：零框架依赖，快速验证产品想法，单文件部署。

### 当前架构（重构后）

```
React SPA (Vite + TypeScript + Tailwind + shadcn/ui)
       │ REST JSON API (OpenAPI)
       ▼
FastAPI (Python 3.12)
  ├── SQLModel / SQLAlchemy（ORM）
  ├── PostgreSQL（生产数据库）
  └── DashScope API（AI 对话）
```

| 层级 | 技术选型 |
|------|---------|
| 后端框架 | FastAPI + Pydantic v2 + SQLModel |
| 数据库 | PostgreSQL（生产）/ SQLite in-memory（测试）|
| 前端框架 | React 18 + TypeScript strict + Vite |
| UI 组件 | Tailwind CSS + shadcn/ui |
| 数据获取 | TanStack Query |
| 代码规范 | Ruff + Mypy（后端）/ Biome（前端）|
| 测试 | Pytest（后端 39 tests）/ Vitest（前端 94 tests）|
| 部署 | Render.com（FastAPI 直接托管 React 构建产物）|
| AI | 阿里云 DashScope `qwen-flash-character` |

### 架构改造内容

本次重构涵盖以下主要改动：

1. **后端框架替换**：原生 `http.server` → FastAPI，引入类型安全的路由、Pydantic schema 验证、分层架构（route → service → model）
2. **前端框架替换**：多页原生 HTML → React SPA，统一路由由 React Router 管理，FastAPI 直接托管 `frontend/dist/`
3. **前后端集成**：建立 `docs/openapi.json` 机器契约，生成 `frontend/src/api/generated/openapi.ts` 类型，消除手写类型漂移风险
4. **进度存储打通**：前端计算阅读进度百分比 → `POST /api/update_current_book` → 写入 `Book.progress`，书架进度条实时同步
5. **测试体系建立**：后端 API 集成测试全覆盖（auth / books / users / chat / SPA serving），前端组件 + hook 单元测试
6. **代码质量清理**：修复 `datetime.utcnow` 弃用、前后端 ID 类型不一致（`number` → `string`）、冗余 fallback、`GuestRoute` 组件提取、`AiOverlay` exhaustive-deps 修复

---

## 🚀 快速开始

### 前置要求

- Python 3.12+
- Node.js 20+，pnpm
- PostgreSQL（本地开发可用 Docker）

### 本地运行

```bash
# 1. 克隆项目
git clone git@github.com:leeing/HuiYi.git
cd HuiYi

# 2. 后端依赖
cd backend
uv sync

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 DATABASE_URL 和 DASHSCOPE_API_KEY

# 4. 前端依赖 + 构建
cd ../frontend
pnpm install
pnpm build

# 5. 启动服务
cd ../backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# 访问 http://localhost:8000
```

### 开发模式（前后端分离）

```bash
# 终端 1 — 后端
cd backend && uv run uvicorn app.main:app --reload

# 终端 2 — 前端（Vite dev server，支持 HMR）
cd frontend && pnpm dev
```

### 测试账号

首次启动自动创建以下测试用户（密码均为 `123456`）：

| 用户名 | 个性签名 |
|--------|---------|
| `test_user_1` | 书山有路勤为径 |
| `book_lover` | 也就是想读点好书 |
| `poem_soul` | 生活不只是眼前的苟且 |

---

## ☁️ 部署

### Render.com

1. Fork 本仓库
2. 在 Render 新建 Web Service，连接仓库
3. 配置环境变量：`DASHSCOPE_API_KEY`、`DATABASE_URL`（PostgreSQL）
4. 点击部署，`render.yaml` 已预配置构建与启动命令

构建命令会自动完成：安装 Python 依赖 → 安装 pnpm → 前端构建 → FastAPI 托管产物。

---

## 📂 目录结构

```
HuiYi/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 应用，托管 React SPA
│   │   ├── api/routes/          # 路由层（auth / books / users / chat）
│   │   ├── services/            # 业务逻辑层
│   │   ├── models/              # SQLModel 数据模型
│   │   ├── schemas/             # Pydantic DTO
│   │   └── core/                # 配置、日志、安全
│   └── tests/                   # Pytest 集成测试
├── frontend/
│   ├── src/
│   │   ├── app/                 # Router、AuthContext、GuestRoute、ProtectedRoute
│   │   ├── api/                 # TanStack Query hooks、类型定义、生成的 OpenAPI 类型
│   │   └── features/            # 页面组件（auth / bookshelf / reader）
│   └── dist/                    # Vite 构建产物（由 FastAPI 托管）
├── docs/
│   ├── openapi.json             # FastAPI 自动导出的 OpenAPI 契约
│   └── API.md                   # AI 友好的 API 摘要
├── static/                      # 书籍 TXT 文件、SVG 头像
└── render.yaml                  # Render 部署配置
```

---

## 🗺️ 后续计划

### 第一优先级：安全基础

- **JWT 认证**：当前 `user_id` 明文传递于请求体，无法抵御伪造请求。引入 JWT 后端签发 / 验证，所有 API 改为从 token 解析用户身份，彻底隔离用户数据

### 第二优先级：手机号登录

- 接入阿里云 SMS（或腾讯云）发送验证码，个人实名即可开通，无需企业资质
- 与 JWT 改造合并实施，User 模型加 `phone` 字段，支持「手机号 + 验证码」与「用户名 + 密码」双入口

### 第三优先级：内容留存

- **划线 / 笔记**：选文后除 AI 解读外，可保存为私人笔记，用户在书里留下自己的痕迹
- **读书日历**：用日历视图展示每天的阅读记录，比进度百分比更有温度

### 第四优先级：AI 主动陪伴

- **书友模式**：AI 在用户翻页时偶尔主动冒泡，频率由用户控制，让「懂书也懂你」真正被感知

### 第五优先级：内容发现

- **公共书库**：精选公版古籍（无版权问题），用户一键加入书架，解决冷启动问题
- **个人页面编辑**：支持修改头像、签名、用户名

---

## ⚠️ 已知限制

- 仅支持 TXT 格式书籍，暂不支持 EPUB
- 目录识别基于规则匹配，复杂格式可能不准
- 认证机制尚未引入 JWT，`user_id` 明文传递（待第一优先级改造）
- 测试环境使用 SQLite in-memory，生产需配置 PostgreSQL

---

## 📄 License

MIT License
