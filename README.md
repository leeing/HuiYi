# 🏮 会意 (Huiyi)

> **懂你也懂书的私人阅读伴侣**

会意是一款自部署的 AI 阅读应用。不追求替代微信读书，不服务成千上万的陌生人——它只服务你，以及你愿意分享书架的家人。

设计初衷很简单：有一个人（或一家人）想安静读书，有一个 AI 真的知道你读过什么、喜欢什么、在哪些段落停留过。所有数据在你自己的机器上，AI 的回应只为你一人定制。

一套后台 API 同时驱动网页端和移动端，无论在电脑前还是手机上，打开就能继续读。AI 模型也不绑定单一服务商——你可以用自己的 API Key，接入任何兼容 OpenAI 接口的大模型。

东方美学为底色，宣纸质感让每一次阅读都有温度。

---

## ✨ 当前功能

### 📚 书架
- 上传 TXT 格式书籍，内置《红楼梦》《生育制度》《长安的荔枝》《基层女性》等经典书目
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
- 默认接入阿里云 `qwen-flash-character`，支持配置自定义模型（兼容 OpenAI 接口）

### 👤 用户系统
- 支持多 profile（家庭成员共用同一实例）
- 用户名 + 密码登录，5 款手绘风格头像 + 个性签名

---

## 🧭 项目定位

**会意不是微信读书的竞品，也不想做所有人的阅读工具。**

它更像一本私人的读书笔记本 + 一个真正了解你阅读品味的书友。你读到某段触动你的文字，划一下，它陪你聊；你翻过哪些书、在哪一页停留了很久，它都记得。

这意味着优先级不按"多用户 SaaS"编排：
- 安全加固（JWT、限流、密码复杂度）——在个人/家庭使用场景下不重要
- AI 的记忆深度、阅读痕迹留存、阅读习惯感知——这些才是会意的核心价值
- 数据私密性——所有数据跑在你自己的机器上，不存在被平台分析和利用的可能

---

## 🏗️ 技术架构

本项���经历了一次完整的技术栈升级，从原型阶段的零依赖实现演进为生产级全栈架构。

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
React SPA (Vite + TypeScript + Tailwind + shadcn/ui)  ← 网页端
       │
  Mobile App (React Native)                            ← 移动端（计划中）
       │
       ├── REST JSON API (OpenAPI)
       ▼
FastAPI (Python 3.12)
  ├── SQLModel / SQLAlchemy（ORM）
  ├── PostgreSQL（生产数据库）
  └── LLM 网关（DashScope / OpenAI 兼容接口，用户可自定义）
```

| 层级 | 技术选型 |
|------|---------|
| 后端框架 | FastAPI + Pydantic v2 + SQLModel |
| 数据库 | PostgreSQL（生产）/ SQLite in-memory（测试）|
| 前端框架 | React 18 + TypeScript strict + Vite（网页端）/ React Native（移动端，计划中）|
| UI 组件 | Tailwind CSS + shadcn/ui |
| 数据获取 | TanStack Query |
| 代码规范 | Ruff + Mypy（后端）/ Biome（前端）|
| 测试 | Pytest（后端 39 tests）/ Vitest（前端 94 tests）|
| 部署 | Render.com（FastAPI 直接托管 React 构建产物）|
| AI | 阿里云 DashScope `qwen-flash-character`（默认）/ 支持自定义 OpenAI 兼容模型 |

### 架构改造内容

本次重构涵盖以下主要改动：

1. **后端框架替换**：原生 `http.server` → FastAPI，引入类型安全的路由、Pydantic schema 验证、分层架构（route → service → model）
2. **前端框架替换**：多页原生 HTML → React SPA，统一路由由 React Router 管理，FastAPI 直接托管 `frontend/dist/`
3. **前后端集成**：建立 `docs/openapi.json` 机器契约，生成 `frontend/src/api/generated/openapi.ts` 类型，消除手写类型漂移风险
4. **进度存储打通**：前端计算阅读进度百分比 → `POST /api/update_current_book` → 写入 `Book.progress`，书架进度条实时同步
5. **测试体系建立**：后端 API 集成测试全覆盖（auth / books / users / chat / SPA serving），前端组件 + hook 单元测试
6. **代码质量清理**：修复 `datetime.utcnow` 弃用、前后端 ID 类型不一致（`number` → `string`）、冗余 fallback、`GuestRoute` 组件提取、`AiOverlay` exhaustive-deps 修复

---

## 💡 定位的演变

会意最初只是一个个人实验——用最原始的技术栈（原生 HTML + Python http.server）快速验证"AI 陪读"这个想法是否成立。

原型跑通后做了全栈重构（FastAPI + React），那时很自然地按照"正经全栈项目"的模板来规划：多用户系统、JWT 认证、安全加固…… 把路线图排得像一个 SaaS 产品的 backlog。

但回头审视才发现这偏离了初衷：

- 用这个应用的人，大概率就是我自己，或者加上家人。不存在"陌生人互相窥探数据"的场景。
- 微信读书有上百人的团队、海量内容版权、成熟的推荐算法——在这里拼功能齐全毫无意义。
- 会意真正独特的地方只有一个：**一个 AI，只了解你一个人的书架，只陪你一个人读书。** 这是任何大平台做不到的。

所以路线图推倒重排：JWT 和密码复杂度不再重要；AI 能不能记住上次聊过什么、能不能在你划线的地方留下笔记、能不能让你回望这个月的阅读足迹——这些才是会意该做的事。

**会意不是一个"更小更弱的微信读书"，它是一个完全不同的东西：一个懂你的私人阅读伴侣。**

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

---

## 🗺️ 路线图

方向由项目定位驱动：**不追求大而全，按需演进，每一步都可以真正用起来。**

### 第一阶段：可读

- **EPUB 格式支持**：覆盖最常见的电子书格式
- **PDF 格式支持**：论文、扫描档也能在会意里读
- 网页端 + 一套 API，在电脑上获得完整的阅读体验

### 第二阶段：可聊

- **划线标记**：选中文字即可保存为私人笔记，在书上留下自己的痕迹
- **AI 简单交互**：划线后唤起 AI 解读，支持用户自定义模型（兼容 OpenAI 接口，用自己的 Key）

### 第三阶段：规划中（按需增加）

不提前设计，根据实际使用中产生的需求逐步添加。可能的方向包括：

- 移动端 APP（共享同一套 API）
- AI 对话记忆（记住聊过什么）
- 读书日历、阅读统计
- 公共书库（公版古籍一键加入）
- 单用户免登录模式

---

## ⚠️ 已知限制

- 当前仅支持 TXT 格式书籍，EPUB / PDF 支持在路线图第一阶段
- 目录识别基于规则匹配（中文"第X章"、英文"Chapter N"），特殊格式可能不准
- AI 对话当前无状态，每次提问不携带历史上下文
- 仅提供网页端，移动端在路线图第三阶段
- 测试环境使用 SQLite in-memory，生产需配置 PostgreSQL

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

## 📄 License

MIT License
