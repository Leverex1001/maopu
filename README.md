# 猫扑 Maopu

猫扑是一个 AI 知识地图与学习路线规划工具。它的目标不是直接塞给用户一张固定课表，而是先理解用户的目标、基础、时间和材料，再把一条学习路线拆成可视化的知识节点、前置依赖、项目练习和资源建议。

## 初心和目的

很多学习计划失败，不是因为资料不够，而是因为一开始看不见知识之间的结构：先学什么、为什么学、某个概念解决什么问题、学到什么程度才算能往下走。

猫扑想解决的是这个问题：

- 让学习目标从一句模糊想法变成一张可编辑地图。
- 让每个知识点都能回答“它为什么存在”。
- 让路线不是静态模板，而是能被识别、生成、修改、保存、导入和分享。
- 让 AI 不只是聊天，而是参与学习规划、解释和下一步决策。

## 当前已实现

### AI 路线规划

- 首页输入学习目标、当前基础、时间限制或资料描述。
- 首页顶部导航可进入上传资料、社区和我的学习；搜索图标可快速聚焦目标输入框。
- AI 识别用户需求，抽取目标、基础、约束和关键词。
- 调用 OpenAI-compatible `chat/completions` API，默认使用 `deepseek-chat`。
- 服务端根据 AI 大纲组装完整知识地图。
- AI 失败、未配置 key 或输出不合格时自动 fallback 到本地路线。
- AI 接口超限、网络失败或服务端异常时，前端会展示具体原因并自动使用本地路线兜底。

### 知识地图

- 使用 React Flow 展示知识节点和依赖关系。
- 节点支持拖拽、搜索、打开详情。
- 节点详情包含：
  - 第一性原理解释
  - 解决的问题
  - 前置知识
  - 学习路径
  - 推荐项目
  - 推荐资源
- 支持新增、编辑、删除节点。
- 节点编辑按钮可明确进入/取消编辑，空标题时会禁用保存。
- 支持修改节点状态：已学习、学习中、未学习。
- 拖动节点会静默保存当前路线位置，并保留本地保存列表里的其他路线。
- 地图页浮层显示整体路线进度百分比和进度条。
- 地图侧边栏提供地图、新增节点、保存、分享、导出、导入、新建路线、我的学习入口，移动端也能触达关键操作。
- 图标按钮补充了可访问名称，键盘和辅助技术能识别其用途。
- 地图页新增路线体检：会给当前路线打分，并检查断开的依赖、重复节点、孤立节点、核心节点、资源和项目建议是否缺失。
- 地图页浮层在窄屏会限制宽度和高度，侧边栏可滚动，避免按钮或路线体检内容撑出横向滚动。
- 首页和普通页面补充移动端快捷导航，上传页与我的学习页在窄屏下会收紧卡片、标题和图片占位，降低重合和穿模风险。
- 空白地图状态会隐藏路线体检浮层，只保留空状态引导，避免弹窗后方文字穿模。
- 视图切换会自动回到页面顶部，避免从首页生成路线后地图页继承旧滚动位置导致画布半屏或黑屏。
- 我的学习页新增账号与云同步入口，预留登录/注册、权限保护和本地路线迁移的产品位置。
- 账号入口已有可交互登录/注册表单，会检查邮箱、密码和 Supabase 公开环境变量是否配置；当前不会保存密码，等待服务端认证动作接入。
- 账号入口支持导出本地路线迁移包，并可复制 Supabase 建表 SQL，便于后续把 localStorage 数据迁移到云端。

### 小扑助手

- 根据当前路线和当前节点回答问题。
- 支持快捷动作：
  - 解释概念
  - 推荐资源
  - 下一步学什么
- 支持自由提问。
- 助手失败时返回本地 fallback 文案，避免界面不可用。
- 助手接口超限或失败时会展示服务端返回的具体原因，再给出本地学习建议。
- 小扑助手浮窗和节点详情面板已做窄屏宽度约束，避免在小屏幕上横向溢出。

### 猫小扑虚拟形象

- 使用现有猫娘 PNG 皮套作为唯一虚拟形象，不再混入 CSS 绘制的小猫装饰。
- 支持六种可切换状态：精神、学习、灵感、思考、困困、开心。
- 每种状态都有对应的主舞台图和裁剪头像，助手浮窗与首页舞台同步当前状态。
- 切换状态时图片带淡入淡出过渡动画（framer-motion AnimatePresence）。
- 主舞台图经过裁剪和白底透明化处理，避免移动端出现白色方块背景。
- 每种状态有轻量 CSS 动效：
  - 精神 / 开心：轻呼吸和挥手回弹。
  - 学习：伏案微动。
  - 灵感：上浮和高光反馈。
  - 思考：慢速摇摆。
  - 困困：慢点头和轻摇头。
- 状态偏好保存在浏览器本地，刷新后恢复。
- 移动端已处理横向溢出，状态按钮头像固定尺寸，页面不会被大图撑出横向滚动条。

### 导入和导出

- 支持导出路线为：
  - Markdown
  - JSON
  - SVG 地图
- 上传页支持：
  - 选择或拖入文件
  - 读取文本、Markdown、CSV 等文本类资料
  - 服务端解析 PDF 文本
  - 服务端解析 Excel / xlsx 工作表
  - 上传页文案会提示 PDF / Excel 已支持内容抽取
  - 导入符合结构的 JSON 路线
  - JSON 路线导入和分享链接会先经过字段规范化，缺失字段会自动补默认值，非法边会被过滤。
  - 粘贴资料内容或网页链接生成路线
  - 没有资料或正在解析时会禁用生成和清空按钮，避免误触发空任务。
  - GitHub 链接抓取 README 和目录结构
- 上传或链接解析失败时，会展示服务端返回的具体原因，并保留文件名、大小或链接作为路线生成线索。

### 社区和我的学习

- 社区页支持路线分类筛选。
- 内置路线卡片可以生成、Fork、收藏和复制分享文本。
- 社区页新增本地发布入口，可以把当前路线保存为“我的发布”草稿，并选择公开、链接可见或私有草稿状态。
- 精选内置路线的 Fork 会复制成一条带“我的 Fork”标题的可编辑路线，而不是只打开原始模板。
- 精选内置路线的复制分享文本包含路线说明、节点数和摘要，不再复制空提示词。
- 收藏记录保存在浏览器本地。
- 我的学习页读取本地保存路线。
- 支持打开、删除本地路线。
- 动态统计保存路线、已学知识点、项目建议数和当前进度。
- 本地保存会捕获浏览器存储空间不足等异常，并提示用户而不是中断界面。

### 分享链接

- 地图页支持生成当前路线分享链接。
- 当前版本使用压缩后的 URL hash 承载路线数据，别人打开链接可以还原同一张图。
- 后续接入数据库后，会升级为短 `shareId` 链接。

### 部署和安全

- 已适配 Vercel 部署。
- API key 只通过服务端环境变量读取，不进入前端 bundle。
- `.env.local` 被 `.gitignore` 排除，不应提交到 GitHub。
- `.env.example` 只包含变量名和示例值。
- AI 接口有第一版内存限流保护：
  - 默认每小时每个访问来源可生成路线 12 次。
  - 默认每小时可识别需求 30 次。
  - 默认每小时可调用小扑助手 60 次。
  - 可通过 `AI_RATE_LIMIT_WINDOW_MS`、`AI_RATE_LIMIT_GENERATE`、`AI_RATE_LIMIT_RECOGNIZE`、`AI_RATE_LIMIT_ASSISTANT` 调整。

## 还没实现

### 产品能力

- 用户账号系统还没有实现。
- 路线数据还没有云端数据库存储。
- 分享功能已可打开同一张路线，但还不是数据库短链接。
- 社区页还是内置路线数据，不是真正的用户发布社区。
- “我的发布”目前保存在浏览器本地，接入数据库后才会成为真正多人社区。
- 收藏、学习记录和路线保存目前都在浏览器本地，清缓存或换设备会丢失。
- 账号与云同步目前已有前端表单和产品入口，真实登录注册需要接入 Supabase Auth 或 Auth.js 的服务端动作。

### AI 能力

- 当前路线生成策略是“AI 生成课程/技能大纲，服务端补全地图”，稳定但深度有限。
- 还没有让 AI 直接生成完整高质量结构化路线。
- 路线体检已有第一版前端规则；还没有接入 AI 评审、自动修复和更严格的服务端校验。
- 还没有按用户水平动态调整难度。

### 文件解析

- PDF、Excel 和 GitHub README/目录已经有第一版解析，但还需要更强的结构化抽取和错误处理。
- 资料上传默认限制单文件 8MB，普通网页抓取默认限制 2MB，粘贴文本默认限制 1MB，可用 `MATERIAL_MAX_FILE_MB`、`MATERIAL_MAX_URL_MB`、`MATERIAL_MAX_TEXT_MB` 调整。
- 图片 OCR 和截图识别还没有实现。

### 工程化

- 当前限流是单实例内存限流；多实例部署时还需要接入 Redis / Upstash 之类的共享限流存储。
- 还没有服务端日志面板和调用统计。
- 还没有端到端测试。
- 国内访问 Vercel 可能不稳定，正式给国内用户使用需要考虑国内部署。

## 可接入开源模块调研

### 登录注册 / 用户系统

- **Supabase Auth + Next.js App Router**：官方 quickstart 已提供 cookie-based auth、TypeScript、Tailwind 的 `with-supabase` 模板，适合同时补登录、云端路线保存和 RLS 权限。
- **Auth.js / NextAuth**：适合只想先做 OAuth、邮箱登录和 session，不急着绑定 Supabase 数据层的路线。
- **login-register-supabase**：GitHub 上有 Next.js 15 + React 19 + Supabase 的登录注册样板，可参考目录结构和 AuthContext，但正式接入建议按本项目现有 App Router 结构重写，而不是整仓复制。

### Supabase 接入草案

建议先接 Supabase，因为它能同时解决登录、数据库、RLS 和短分享链接。

前端公开环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

建议的数据表：

```sql
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  summary text not null default '',
  route jsonb not null,
  visibility text not null default 'private' check (visibility in ('private', 'public', 'unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table public.route_progress (
  user_id uuid references auth.users(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  node_id text not null,
  status text not null check (status in ('learned', 'learning', 'unlearned')),
  updated_at timestamptz not null default now(),
  primary key (user_id, route_id, node_id)
);
```

RLS 方向：

- `routes` 私有记录只能 owner 读写，`public` / `unlisted` 可以公开读。
- `route_favorites` 和 `route_progress` 只能当前登录用户读写自己的记录。
- 服务端生成短分享链接时只暴露 `routes.id` 或单独的 `share_slug`，不再把完整路线塞进 URL hash。

### 前端 UI

- **shadcn/ui blocks**：认证页已有 `login-01` 等开源 block，可以复制登录/注册表单源码，再改成猫扑视觉风格。
- **Radix UI primitives**：适合替换当前手写的弹窗、菜单、标签页和 tooltip，提高键盘可访问性。
- **React Hook Form + Zod**：适合登录、注册、路线发布、节点编辑等表单校验。

### Codex Skills

- 可用 `$skill-installer` 从 `openai/skills` 安装 curated skills。
- 对猫扑当前最有用的候选：
  - `playwright` / `screenshot`：做页面穿模和端到端视觉验证。
  - `vercel-deploy`：规范 Vercel 部署流程。
  - `security-threat-model` / `security-best-practices`：接入登录、分享和用户数据前做安全梳理。
  - `gh-fix-ci` / `gh-address-comments`：后续接 GitHub PR 工作流时使用。

## 推荐实现顺序

1. **API 限流和额度保护**

   先保护模型 API key。可以按 IP、浏览器指纹或登录用户限制每日生成次数。

2. **云端路线保存**

   接入 Supabase、Neon 或其他数据库，把路线、节点、收藏和学习状态从本地存储迁到云端。

3. **分享链接**

   为路线生成 `shareId`，让别人打开链接就能查看同一张知识地图。

4. **用户系统**

   优先用 Supabase Auth 或 Auth.js，不从零写密码登录；支持登录、我的路线、我的收藏、公开/私有路线。

5. **真实社区**

   用户可以发布路线、Fork 路线、收藏路线、按标签筛选和搜索。

6. **文件解析升级**

   优先实现 Markdown/TXT 完整解析，再实现 PDF 和 Excel，最后做 GitHub 仓库抓取。

7. **AI 路线质量升级**

   从课程名大纲升级为结构化路线草案，并加入服务端校验、补全、去重和依赖检查。

8. **国内可访问部署**

   如果要给国内同学稳定试用，可以考虑阿里云、腾讯云、学校服务器，或国内前端托管加后端服务。

## 本地开发

安装依赖：

```bash
npm install
```

创建本地环境变量：

```bash
cp .env.example .env.local
```

填写 `.env.local`：

```env
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=your-api-key-here
AI_MODEL=deepseek-chat
AI_RATE_LIMIT_WINDOW_MS=3600000
AI_RATE_LIMIT_GENERATE=12
AI_RATE_LIMIT_RECOGNIZE=30
AI_RATE_LIMIT_ASSISTANT=60
MATERIAL_MAX_FILE_MB=8
MATERIAL_MAX_URL_MB=2
MATERIAL_MAX_TEXT_MB=1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 部署

推荐使用 Vercel。部署时在平台后台配置环境变量：

```env
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=your-api-key-here
AI_MODEL=deepseek-chat
AI_RATE_LIMIT_WINDOW_MS=3600000
AI_RATE_LIMIT_GENERATE=12
AI_RATE_LIMIT_RECOGNIZE=30
AI_RATE_LIMIT_ASSISTANT=60
MATERIAL_MAX_FILE_MB=8
MATERIAL_MAX_URL_MB=2
MATERIAL_MAX_TEXT_MB=1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

不要把真实 API key 写入源码、README、前端代码或 GitHub commit。

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Flow
- Framer Motion（页面动画、形象切换过渡）
- Lucide React
- DeepSeek / OpenAI-compatible API

## 项目状态

当前阶段：可公开试玩的 MVP。

它已经可以完成“描述目标 -> AI 识别 -> 生成知识地图 -> 编辑保存 -> 小扑辅助解释”的主流程，但还不是完整多人在线产品。下一阶段的重点是云端数据、分享链接、限流保护和真实社区。
