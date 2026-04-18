# TODO

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
