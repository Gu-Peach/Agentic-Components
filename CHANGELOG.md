# CHANGELOG

## 2026-04-16

### Added

- 新建 `TODO.md`，建立 Phase 1 前端阶段目标、任务索引、验收标准和任务状态机制。
- 新建 `CHANGELOG.md`，用于记录后续每次文档与代码变更。
- 初始化 `frontend/` Next.js 16 + TypeScript + Tailwind CSS 4 工程。
- 新增 `/workspace/[projectId]` 路由和工业风工作区基础布局。
- 新增 `TopBar`、`SimulationBar`、`WorkspaceLayout`、`ECatalogPanel`、`Viewport3D`、`PropertiesPanel`、`AIChatPanel`、`TerminalPanel`。
- 新增 `sceneStore`、`catalogStore`、`simulationStore`、`agentStore` 以及对应类型定义。

### Changed

- 将默认首页替换为跳转到 `/workspace/demo-factory` 的工作区入口。
- 将默认全局样式替换为 Visual Components 4.8 风格的深色工业主题变量。
- 重构工作区布局为左侧电子目录、中间渲染区加中下方输出区、右侧属性加聊天区的可拉伸结构。
- 重构电子目录面板为收藏树加模型预览双区结构，并调整搜索栏与预览卡片样式。
- 重构属性面板为坐标区加默认参数与 Simulation 参数切换结构，并压缩面板留白以贴近桌面软件风格。
- 重构渲染区为浅色工业舞台样式，顶部悬浮透明播放条，底部保留方向方块与场景对象浮层。
- 重构输出面板与大模型聊天区，使其与主布局保持紧凑一致的桌面式视觉。
- 将根路由 `/` 调整为认证入口，当前默认跳转到 `/login`。
- 更新前端设计文档中的路由结构，补充 `/login`、`/auth/callback/[provider]`、`/projects` 等认证相关页面职责。

### Added

- 新增 `/login` 登录页骨架，为 OAuth 2.0 和双 Token 认证流程预留 UI 入口。

### Verified

- `frontend`: `corepack pnpm run lint`
- `frontend`: `corepack pnpm run build`

## 2026-04-19

### Added

- 新增 `database/postgresql/001_auth_tables.sql`，定义 `users`、`oauth_accounts`、`refresh_tokens` 认证域表结构、索引与 `updated_at` 触发器。
- 新增 `frontend/lib/auth-providers.ts`、`frontend/lib/auth.ts`、`frontend/types/next-auth.d.ts`，建立 Auth.js provider 配置、JWT Session 策略和 Session 类型扩展。
- 新增 `frontend/app/api/auth/[...nextauth]/route.ts`，提供 OAuth 认证入口。
- 新增 `frontend/components/auth/OAuthLoginButtons.tsx`，封装 GitHub / Google OAuth 登录按钮。
- 新增 `frontend/app/projects/page.tsx`，作为登录成功后的落点页。
- 新增 `frontend/.env.example`，补充 `NEXTAUTH_SECRET` 与 OAuth provider 所需环境变量模板。
- 新增 `backend/` 认证服务骨架，包括 FastAPI 入口、配置、数据库连接、SQLAlchemy 模型、认证仓储、认证服务和 `/api/auth` 路由。
- 新增 `backend/.env.example`、`backend/requirements.txt`、`backend/Dockerfile`，为后端服务本地运行和容器化提供基础配置。
- 新增 `backend/.env` 本地开发配置文件，补齐 PostgreSQL 连接、JWT 签名和前后端认证桥接密钥。
- 新增 `backend/README.md`，整理后端本机启动、Docker 基础设施启动、环境变量说明和联调步骤。
- 新增 `docs/design/backend/oauth2_login_flow.md`，详细说明当前 OAuth 2.0 登录链路、前后端请求路径、请求/响应数据结构和环境变量用途。
- 新增 `frontend/lib/backend-auth.ts`，封装前端到后端认证服务的 OAuth 换票与 refresh token 刷新请求。

### Changed

- 重构 `frontend/app/login/page.tsx`，将登录页骨架升级为实际的 OAuth 2.0 登录入口页，并展示认证表结构与环境变量提示。
- 修改 `frontend/app/page.tsx`，根路由现在会依据登录态分流到 `/login` 或 `/projects`。
- 修改 `frontend/app/workspace/[projectId]/page.tsx`，未登录用户无法直接进入工作区。
- 更新 `docs/design/frontend/frontend_design_plan.md`，将认证路由说明同步为 Auth.js 实际落地的 `/api/auth/[...nextauth]` 结构。
- 重构 `frontend/lib/auth.ts`，在 Auth.js 登录回调中接入后端 `/api/auth/oauth/exchange` 和 `/api/auth/refresh`，将页面保护逻辑切换为系统自身的应用 Token。
- 修改 `frontend/types/next-auth.d.ts`，补充应用 access token / refresh token、过期时间和认证错误状态的 Session/JWT 类型。
- 修改 `frontend/app/login/page.tsx`、`frontend/app/page.tsx`、`frontend/app/projects/page.tsx`、`frontend/app/workspace/[projectId]/page.tsx`，统一按后端签发的应用 Token 判断登录态。
- 修改 `docker-compose.yml`，新增 `backend` 服务并将 PostgreSQL 初始化目录对齐到 `database/postgresql/`。
- 更新 `docs/design/backend/backend_design_plan.md`，补充 OAuth 资料换发双 Token 的后端认证接口。
- 重写 `docker-compose.yml` 为当前认证阶段更易维护的最小栈，仅保留 `postgres`、`backend`、`pgadmin`，移除固定 `container_name` 并改用 Docker named volumes。
- 继续扩展 `docker-compose.yml`，将 `mongodb`、`redis`、`minio` 以同样的 named volumes 方案补回当前项目环境。
- 调整 `backend/.env` 和 `backend/.env.example` 中的 `CORS_ORIGINS` 为 JSON 数组格式，以兼容 `pydantic-settings` 对 `list[str]` 的解析。
- 修正 `backend/core/auth.py`、`backend/services/auth_service.py` 的时区写法，使后端兼容本机 Python 3.10。
- 修正 `backend/repositories/pg/auth_repository.py` 的 `datetime` 类型注解导入，消除本地启动时的运行错误。
- 修正登录页 OAuth 按钮的 SSR/CSR 渲染不一致问题，将 provider 可用状态改为仅在服务端计算并作为 props 传给客户端组件，消除 hydration mismatch。
- 修正 `backend/schemas/auth.py` 中 `CurrentUserResponse.id` 的 UUID 序列化问题，避免 OAuth 换票成功后在响应阶段抛出 500。

### Verified

- `frontend`: `corepack pnpm run lint`
- `frontend`: `corepack pnpm run build`
- `backend`: `python -m compileall backend`

### Reset

- 清理了本机现有数据库相关 Docker 容器以及仓库内旧的 `data/` 持久化目录，重新初始化本项目数据库环境。
- 使用新 compose 成功启动了 `postgres` 和 `pgadmin`。
- 进一步成功启动了 `mongodb`、`redis`、`minio`，完整基础设施已经恢复。
- `backend` 容器启动暂时被 Docker 镜像拉取网络错误阻塞，不属于当前项目配置文件错误。
- 改为本机 Python 方式成功启动 `backend`，`http://localhost:8000/health` 返回正常。
- 改为本机 `pnpm dev` 方式成功启动 `frontend`，`http://localhost:3000` 返回 `200`。
