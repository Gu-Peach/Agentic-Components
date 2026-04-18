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

### Verified

- `frontend`: `corepack pnpm run lint`
- `frontend`: `corepack pnpm run build`
