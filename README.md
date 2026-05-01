# 🏮 会意 (Huiyi)

> **懂书也懂你的 AI 阅读伴侣**

会意是一款融合沉浸式阅读与 AI 深度互动的智能阅读社区平台。东方美学设计风格，以宣纸质感为底色，让每一次阅读都有温度。

---

## ✨ 功能亮点

### 📚 智能书架
- 支持 TXT 书籍本地导入，内置《红楼梦》《生育制度》《长安的荔枝》《基层女性》等经典书目
- 根据书名哈希自动生成独特渐变色封面，无需封面图
- 实时显示阅读进度（百分比）与阅读状态（未开始 / 阅读中 / 已读完）

### 📖 沉浸式阅读器
- 仿真分页显示，告别瀑布流，还原纸书翻页感
- 多种翻页方式：点击左右区域 / 键盘方向键 / 移动端左右滑动
- 三种阅读主题：羊皮纸（默认）/ 护眼绿 / 夜间模式
- 字号无级调节（14px–24px），偏好本地记忆
- 自动识别章节标题，生成侧边栏目录并支持跳转

### 🤖 AI 伴读「会意」
- 划选任意文字即可唤起 AI 浮层，进行深度解读与赏析
- AI 自动关联当前书籍内容与用户书架，提供有温度的个性化回应
- 独立 AI 书友对话页，随时与"会意"闲聊读书心得
- 基于阿里云 `qwen-flash-character` 模型驱动

### 📝 阅读笔记
- 支持划线高亮与私人批注
- 心得笔记管理，随时回顾阅读感悟

### 👤 个人中心与书友社群
- 5 款手绘风格头像（猫 / 狗 / 书 / 花 / 鸟）
- 个人数据统计：书龄、阅读量、已读 / 在读数量
- 关注 / 粉丝系统，书友匹配推荐
- 预设经典文学兴趣小组（红楼梦、西游记等）一键加入

---

## 🏗️ 技术架构

```
Frontend (纯 HTML + Tailwind CSS + 原生 JS)
       │
       │ REST JSON API (HTTP)
       ▼
Backend (Python 标准库 http.server)
  ├── SQLite  ← 用户、书籍、进度持久化
  └── DashScope API  ← AI 对话 (qwen-flash-character)
```

| 层级 | 技术选型 |
|---|---|
| 后端 | Python 标准库（`http.server` + `sqlite3`），零框架依赖 |
| 前端 | 原生 HTML / JS + Tailwind CSS（本地化部署） |
| 数据库 | SQLite（单文件，随启随用） |
| AI | 阿里云 DashScope `qwen-flash-character` |
| 部署 | Railway / Render.com（一键部署） |

---

## 🚀 快速开始

### 本地运行

**前置要求**：Python 3.8+，无需安装任何第三方包

```bash
# 1. 克隆项目
git clone <repo-url>
cd HuiYi

# 2. 配置 AI 密钥（可选，不配置则 AI 功能不可用）
# 在 .env 或系统环境变量中设置 DASHSCOPE_API_KEY

# 3. 启动服务
python run_app.py

# 4. 打开浏览器访问
# http://localhost:8000
```

### 测试账号

首次启动会自动创建以下测试用户（密码均为 `123456`）：

| 用户名 | 个性签名 |
|---|---|
| `test_user_1` | 书山有路勤为径 |
| `book_lover` | 也就是想读点好书 |
| `poem_soul` | 生活不只是眼前的苟且 |

---

## ☁️ 云端部署

### Render.com

1. Fork 本仓库
2. 在 Render 新建 Web Service，连接你的仓库
3. 配置环境变量 `DASHSCOPE_API_KEY`
4. 点击部署，`render.yaml` 已预配置好所有参数

### Railway

1. Fork 本仓库
2. 在 Railway 导入项目
3. 配置环境变量 `DASHSCOPE_API_KEY`
4. 自动读取 `Procfile` 启动

---

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/register` | 用户注册 |
| `POST` | `/api/login` | 用户登录 |
| `GET` | `/api/books?user_id=` | 获取书架列表 |
| `GET` | `/api/book_content?book_id=` | 获取书籍全文 |
| `GET` | `/api/current_book?user_id=` | 获取当前阅读书目 |
| `GET` | `/api/user_profile?user_id=` | 获取用户信息 |
| `POST` | `/api/upload` | 上传书籍（Base64 TXT） |
| `POST` | `/api/chat` | AI 对话 |
| `POST` | `/api/update_current_book` | 更新当前阅读书籍 |

---

## 📂 目录结构

```
HuiYi/
├── run_app.py          # 后端服务（HTTP Server + API + DB）
├── login.html          # 登录 / 注册页
├── bookshelf.html      # 书架主页
├── reader.html         # 沉浸式阅读器
├── chat.html           # AI 书友对话
├── notes.html          # 阅读笔记
├── profile.html        # 个人中心
├── static/
│   ├── books/          # 书籍 TXT 文件
│   ├── avatars/        # SVG 手绘头像
│   └── tailwind.js     # Tailwind CSS（本地化）
├── Procfile            # Railway 部署配置
├── render.yaml         # Render 部署配置
├── requirements.txt    # 依赖（几乎为空）
└── PRD.md              # 产品需求文档
```

---

## 🎨 设计规范

| 设计要素 | 说明 |
|---|---|
| 主色调 | 宣纸色 `#F9F5F0` + 墨色 `#2C2C2C` + 暖红 `#A64D4D` |
| 字体 | 思源宋体 Noto Serif SC（主）+ 朱孟星手写体（装饰） |
| 质感 | 全站纸张纹理背景 + 卡片毛玻璃效果 |
| 适配 | 手机优先，最大宽度 430px，完美适配 iOS / Android |

---

## ⚠️ 已知限制

- 目前仅支持 **TXT 格式**书籍导入，暂不支持 EPUB
- 目录识别基于规则匹配，复杂格式可能不准确
- AI 功能依赖阿里云 DashScope 免费额度，有调用次数上限
- 登录态基于 `localStorage` 存储，无 Token 过期机制
- SQLite 不适用于高并发场景，适合个人 / 小团队使用

---

## 🗺️ 未来规划

- **v1.1**：EPUB 引擎升级，支持插图与复杂排版；笔记导出为 Markdown/PDF
- **v1.2**：真实社区化，书评广场，共读挑战活动
- **v1.3**：AI 角色定制，支持自定义伴读人格（毒舌评论家 / 温柔知己）

---

## 📄 License

MIT License
