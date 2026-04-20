# TODO

## 阶段目标

- 当前阶段：Phase 1 - 通义千问流式聊天接入（M1）
- 阶段周期：2026-04-20，1 天
- 阶段目标：将右下角聊天区从本地 mock SSE 切换为服务端代理通义千问 DashScope OpenAI 兼容流式接口。
- 验收标准：
  - `frontend/.env.local` 配置 `DASHSCOPE_API_KEY` 后可收到通义千问真实流式响应。
  - 浏览器端继续使用 `fetch`、`ReadableStream` 和现有 SSE parser 读取数据。
  - Assistant 消息继续使用 `requestAnimationFrame` 打字机效果显示。
  - 未配置 API key 时聊天区返回明确配置提示，`pnpm run lint` 通过。

## 当前阶段任务清单

- `done` `FE-CHAT-016` `P1` `M1`
  接入通义千问 API：服务端 `/api/chat` 使用 DashScope OpenAI 兼容接口代理流式响应，浏览器端保持 SSE + ReadableStream + RAF 打字机链路。
  Acceptance Criteria: 配置 `DASHSCOPE_API_KEY` 后聊天区能收到通义千问真实流式响应，未配置时返回明确提示，lint 通过。

## 阶段目标

- 当前阶段：Phase 1 - AI 聊天 Demo 流式输出（M1）
- 阶段周期：2026-04-20，1 天
- 阶段目标：在右下角大模型聊天区域实现本地 demo，对齐后续真实 agent 接入方式，先完成 fetch + ReadableStream 读取 SSE 文本流与 requestAnimationFrame 打字机渲染。
- 验收标准：
  - 聊天输入可发送用户消息，并触发本地 SSE demo 接口。
  - 前端通过 `fetch` 获取响应，并使用 `ReadableStream` reader 增量解析 `data:` SSE 数据。
  - Assistant 消息使用基于 `requestAnimationFrame` 的打字机效果逐字显示。
  - `pnpm run lint` 通过，相关文件不超过仓库行数限制。

## 当前阶段任务清单

- `done` `FE-CHAT-007` `P1` `M1`
  实现 AI 聊天区 demo 流式输出与打字机效果：Next.js 本地 SSE route、前端 SSE parser、requestAnimationFrame typewriter hook、聊天输入交互。
  Acceptance Criteria: 输入消息后右下角聊天区能显示用户消息，assistant 响应由 SSE 增量返回并通过 RAF 打字机效果显示，lint 通过。

## 阶段目标

- 当前阶段：Phase 1 - 前端面板构建（M1）
- 阶段周期：Week 1 - Week 5
- 阶段目标：不依赖任何后端，用 Mock 数据完成全部前端 UI 组件，并形成可完整演示的工作区。
- 验收标准：
  - 五区域工作区可正常显示并可调整尺寸
  - eCatalog、3D 视口、属性面板、AI 聊天、Terminal 全部可交互
  - Mock 数据驱动完整前端流程
  - 达成 `docs/design/development_plan_llm.md` 中 M1 里程碑要求

## 当前阶段任务清单

- `done` `FE-BOOT-001` `P0` `M1`
  建立前端工程基础脚手架：Next.js 16 + TypeScript + Tailwind CSS 4，并创建 Phase 1 执行文档。
  索引：`docs/design/development_plan_llm.md` -> `7. 开发阶段规划` -> `Phase 1` -> `Week 1：工程初始化 + 布局骨架`
  验收标准：仓库中存在 `frontend/` 工程目录、基础配置文件、`TODO.md`、`CHANGELOG.md`。

- `done` `FE-LAYOUT-002` `P0` `M1`
  实现五区域布局骨架与工业风主题变量，包括 TopBar / ECatalog / Viewport / Properties / Terminal。
  索引：`docs/design/development_plan_llm.md` -> `3.1 布局结构`、`3.2 目录结构`、`Phase 1` -> `Week 1`
  验收标准：页面展示五区域布局，区域尺寸可调整，主题变量已落地。

- `done` `FE-STORE-003` `P0` `M1`
  建立 Zustand 状态骨架：`sceneStore` / `catalogStore` / `simulationStore` / `agentStore`。
  索引：`docs/design/development_plan_llm.md` -> `3.2 目录结构`、`Phase 1` -> `Week 1`
  验收标准：4 个 store 文件存在，包含基础类型、初始状态与关键动作占位。

- `in_progress` `FE-CATALOG-004` `P0` `M1`
  实现 eCatalog 面板：CollectionsTree、DeviceGrid、DeviceCard、SearchBar，并接入 Mock 设备数据。
  索引：`docs/design/development_plan_llm.md` -> `3.2 目录结构`、`Phase 1` -> `Week 2：eCatalog 面板`
  验收标准：目录树可折叠，设备网格可搜索、可拖拽，支持大量 Mock 数据渲染。

- `done` `FE-UX-010` `P0` `M1`
  按照 Visual Components 风格重构工作区样式与面板布局，形成紧凑桌面式 UI，并保持左右中三区与中下输出区可拉伸。
  索引：`docs/design/development_plan_llm.md` -> `3.1 布局结构`、`3.4 属性面板 Tab 结构`、`3.6 Terminal 面板`
  验收标准：左侧电子目录包含收藏树和模型预览区，右侧属性区含坐标与参数区，下方含聊天区，中间为渲染区和透明播放面板，中下方为输出面板，所有主分区支持拉伸。

- `done` `FE-AUTH-011` `P0` `M1`
  调整前端路由结构以支持认证入口，并搭建登录页骨架，为 OAuth2.0 和双 Token 机制预留页面入口。
  索引：`docs/design/frontend/frontend_design_plan.md` -> `三、目录结构`
  验收标准：前端设计文档包含认证相关路由，`/` 作为入口跳转到登录页，存在 `/login` 登录页骨架。

- `done` `AUTH-DATA-012` `P0` `M1`
  定义认证域数据库结构，包括用户主表、OAuth 账号映射表和刷新令牌表，为双 Token 机制提供持久化基础。
  索引：`docs/design/database/database_construction_plan.md` -> `二、PostgreSQL 完整 Schema`
  验收标准：仓库中存在可执行的认证 SQL 结构文件，包含 `users`、`oauth_accounts`、`refresh_tokens` 三类表及必要索引。

- `done` `AUTH-OAUTH-013` `P0` `M1`
  在前端接入基于 OAuth2.0 的登录流程，支持 Auth.js 认证入口、OAuth provider 跳转、登录态分流和工作区保护。
  索引：`docs/design/frontend/frontend_design_plan.md` -> `三、目录结构`
  验收标准：`/login` 可触发 OAuth 登录，`/` 能按登录态分流，未登录用户不能直接进入 `/workspace/[projectId]`。

- `done` `AUTH-BE-014` `P0` `M2`
  搭建后端认证服务骨架，提供 OAuth 登录资料换发应用双 Token、刷新 Token 和当前用户查询接口。
  索引：`docs/design/backend/backend_design_plan.md` -> `五、API 接口设计` -> `5.1 认证`
  验收标准：仓库中存在 `backend/` 认证服务代码，至少包含 `POST /api/auth/oauth/exchange`、`POST /api/auth/refresh`、`GET /api/auth/me` 三类接口及 JWT/Refresh Token 逻辑。

- `done` `AUTH-INTEGRATE-015` `P0` `M2`
  将前端 Auth.js 登录链路接入后端认证服务，在 OAuth 登录成功后同步用户资料并获取系统自身的 access token / refresh token。
  索引：`docs/design/backend/backend_design_plan.md` -> `五、API 接口设计` -> `5.1 认证`，`docs/design/frontend/frontend_design_plan.md` -> `三、目录结构`
  验收标准：前端登录成功后 Session 中包含后端签发的应用 Token，受保护页面按应用登录态分流。

- `ready` `FE-VIEWPORT-005` `P0` `M1`
  实现 3D Viewport 基础：Canvas、GridFloor、OrbitControls、设备占位体、选中高亮、拖拽入场。
  索引：`docs/design/development_plan_llm.md` -> `3.3 拖拽入场实现`、`Phase 1` -> `Week 3：3D Viewport 基础`
  验收标准：可从 eCatalog 拖拽设备到场景中，设备支持选中高亮。

- `ready` `FE-PROPS-006` `P0` `M1`
  实现属性面板与仿真控制条：CoordinateWidget、DefaultTab、SimulationTab、SimulationBar。
  索引：`docs/design/development_plan_llm.md` -> `3.4 属性面板 Tab 结构`、`Phase 1` -> `Week 4`
  验收标准：不同设备类型可切换不同字段，字段修改可以更新 store。

- `ready` `FE-CHAT-007` `P1` `M1`
  实现 AI 聊天区与打字机效果：AIChatPanel、MessageList、StreamMessage、ChatInput、useTypewriter。
  索引：`docs/design/development_plan_llm.md` -> `3.5 打字机效果实现`、`Phase 1` -> `Week 5`
  验收标准：Mock SSE 可驱动流式文本显示，输入框支持自动增高。

- `ready` `FE-TERM-008` `P1` `M1`
  实现 Terminal 面板：ANSI 渲染、自动滚底、Mock 仿真日志。
  索引：`docs/design/development_plan_llm.md` -> `3.6 Terminal 面板`、`Phase 1` -> `Week 5`
  验收标准：日志可分行显示并自动滚动，颜色映射符合文档约定。

- `ready` `FE-INTEGRATE-009` `P0` `M1`
  完成 Phase 1 整体联调：拖拽、选中、属性修改、聊天、终端、响应式布局统一协作。
  索引：`docs/design/development_plan_llm.md` -> `Phase 1` -> `Week 5：整体联调`、`里程碑汇总` -> `M1`
  验收标准：完整前端可交互演示，满足 M1 里程碑。

## 进度记录

- 2026-04-16：创建 Phase 1 执行清单，开始 `FE-BOOT-001`。
- 2026-04-16：完成 `FE-BOOT-001`、`FE-LAYOUT-002`、`FE-STORE-003`，进入 `FE-CATALOG-004`。
- 2026-04-16：新增 `FE-UX-010`，重构工作区样式以贴近目标桌面布局。
- 2026-04-16：完成 `FE-UX-010`，工作区已调整为左右中三列加中下输出区的紧凑桌面布局。
- 2026-04-18：新增 `FE-AUTH-011`，开始搭建认证入口和登录页骨架。
- 2026-04-18：完成 `FE-AUTH-011`，根路由已切换为认证入口并新增登录页骨架。
- 2026-04-19：新增 `AUTH-DATA-012`、`AUTH-OAUTH-013`，开始实现用户表结构和 OAuth2.0 登录流程。
- 2026-04-19：完成 `AUTH-DATA-012`，新增认证域 SQL 结构，包含 `users`、`oauth_accounts`、`refresh_tokens` 三张核心表。
- 2026-04-19：完成 `AUTH-OAUTH-013`，登录页已接入 Auth.js OAuth 入口，根路由和工作区已按登录态分流与保护。
- 2026-04-19：新增 `AUTH-BE-014`、`AUTH-INTEGRATE-015`，开始搭建后端认证服务并将前端登录链路接入系统自身双 Token。
- 2026-04-19：完成 `AUTH-BE-014`，新增 FastAPI 认证服务骨架，支持 OAuth 资料换票、刷新 Token 和当前用户查询。
- 2026-04-19：完成 `AUTH-INTEGRATE-015`，前端 OAuth 登录后会向后端换发系统自身双 Token，并按应用 Token 保护页面访问。
