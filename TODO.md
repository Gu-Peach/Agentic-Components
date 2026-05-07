# TODO

## 阶段目标

- 当前阶段：Phase 1 - Agent 澄清追问回归修复（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：修复“把物料放到仓位”仍默认进入 A1 执行计划的问题，确保未指定仓位时不会被调度 fallback 自动补默认目标。
- 验收标准：
  - 输入“把物料放到仓位”时后端返回 `clarification_required`
  - `/api/agent/stream` 不返回 `execution_plan` 或 `step_session`
  - 前端聊天面板展示澄清问题，不显示待执行计划
  - 输入“把物料放到仓位 A1”仍可继续生成计划
  - 后端编译和前端 lint/typecheck 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `AGENT-CLARIFY-BUG-050` `P0` `M2`
  修复仓位缺失追问未生效的回归，增强后端澄清规则与前端澄清展示，避免调度阶段默认补 A1。
  Acceptance Criteria: 缺仓位输入触发澄清事件；带 A1/A2 等明确仓位输入可执行；前端不会为澄清响应创建 pending plan；静态检查通过。

## 阶段目标

- 当前阶段：Phase 1 - Agent 主动追问缺失条件 MVP（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：在调度前增加缺失条件识别能力，当用户输入无法形成明确可执行计划时，Agent 先返回澄清问题，不生成 execution plan 或触发动画。
- 验收标准：
  - 后端在 scheduling 前识别明显缺失的目标、设备或修正参数
  - SSE 能输出 `clarification_required` 事件并保持 `/run` 兼容
  - 前端收到澄清事件后只展示问题，不进入计划确认或动画执行
  - 常规仿真输入仍能正常生成待确认计划
  - Python 编译检查与前端 lint/typecheck 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `AGENT-CLARIFY-049` `P0` `M2`
  增加 Agent 主动追问缺失条件 MVP，在用户意图缺少关键执行槽位时返回结构化澄清问题，并阻止无效计划进入动画链路。
  Acceptance Criteria: 后端返回 `clarification_required` 状态与问题列表；SSE 推送澄清事件；前端不会创建 pending execution plan；常规 demo 输入仍保持可执行。

## 阶段目标

- 当前阶段：Phase 1 - Agent 执行前人工确认闸门（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：实现高级闭环能力的第一步，在 Agent 生成 execution plan 后先等待用户确认，不再自动立即驱动画面执行。
- 验收标准：
  - AI 聊天区展示待确认的计划摘要
  - 用户点击执行后才写入 `execution_plan` 并启动动画
  - 用户可以取消本次待执行计划
  - 用户可以进入修改输入，基于当前计划重新提出修正要求
  - SSE 接收与现有仿真播放链路保持兼容

## 当前阶段任务清单

- `done` `FE-AGENT-APPROVAL-048` `P0` `M2`
  增加 Agent 计划执行前确认 UI 与前端状态暂存，使 execution plan 不再在 SSE 到达时自动播放。
  Acceptance Criteria: `execution_plan` 先进入 pending review；确认后才调用 `setExecutionPlan`；取消和修改入口可用；前端静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - Agent 高级闭环能力规划补充（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：将下一阶段高级 Agent 能力纳入闭环架构文档，包括人工确认、自动重规划、主动追问、多轮计划修正 UI、LangGraph 节点级可视化与持久化。
- 验收标准：
  - `docs/agent/closed_loop_agent_architecture.md` 明确记录五类高级能力
  - 每类能力包含目标、状态字段、接口或 UI 入口、落地顺序
  - 明确这些能力属于当前 MVP 之后的增强阶段
  - 不改变当前可运行 Agent MVP 行为

## 当前阶段任务清单

- `done` `DOC-AGENT-ADVANCED-047` `P1` `M2`
  补充闭环 Agent 高级能力规划，将用户确认/修改、observation 失败重规划、主动追问、多轮协商 UI、LangGraph 可视化与持久化写入架构路线。
  Acceptance Criteria: 文档新增高级能力章节；能力边界、状态模型、接口/UI 入口和阶段路线清晰；当前代码行为不变。

## 阶段目标

- 当前阶段：Phase 1 - Agent 聊天输出性能优化（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：在功能实现和执行效率优先的阶段，关闭大模型流式输出的打字机逐字渲染，减少聊天面板卡顿并提高信息显示及时性。
- 验收标准：
  - AI 聊天面板不再调用 `useTypewriter`
  - SSE 增量接收链路保持不变
  - assistant 内容到达后直接显示
  - 前端类型检查或 lint 通过

## 当前阶段任务清单

- `done` `FE-CHAT-PERF-046` `P1` `M2`
  关闭 Agent 聊天面板的打字机效果，保留流式接收但直接渲染完整当前内容。
  Acceptance Criteria: `AIChatPanel` 不再使用 `useTypewriter`；流式内容仍能更新 assistant 消息；前端静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - 参考仓库 Git 边界整理（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：将 `behavior` 与 `gptwin2` 明确为本地参考目录，避免主仓库将其作为 gitlink/submodule 统计到 Source Control。
- 验收标准：
  - `behavior` 与 `gptwin2` 不再作为主仓库 tracked gitlink
  - 根目录 `.gitignore` 忽略两个参考目录
  - 本地目录内容不被删除
  - `git status` 能清楚显示主仓库真实待提交项

## 当前阶段任务清单

- `done` `REPO-REF-IGNORE-045` `P0` `M2`
  剥离 `behavior` 与 `gptwin2` 在主仓库中的 gitlink 跟踪关系，并将其作为本地参考目录忽略。
  Acceptance Criteria: 两个目录已从主仓库索引移除但本地文件保留；`.gitignore` 已包含忽略规则；状态检查能够证明主仓库不再被参考项目污染。

## 阶段目标

- 当前阶段：Phase 1 - 闭环 Agent Step-by-step 执行协议（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：在最小闭环状态模型基础上，实现后端按 segment 下发执行步骤、前端在动画完成后生成 observation、后端接收 observation 并推进下一步的基础协议。
- 验收标准：
  - 后端提供 step session 初始化、当前 step 查询、observation 提交和下一步推进能力
  - 前端 simulation store 能产生 `segment_completed` / `simulation_completed` 观察事件
  - 当前一次性 SSE 播放链路保持兼容
  - 新增协议可表达 `continue`、`finish`、`failed` 三种 supervisor route
  - Python 编译检查与前端 lint/typecheck 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `AGENT-STEP-LOOP-044` `P0` `M2`
  构建闭环 Agent 的最小 step-by-step 执行协议，使后端能够逐段推进执行并接收前端 observation。
  Acceptance Criteria: 后端 step runtime/API 已实现；前端 observation 状态已实现；现有一次性动画仍兼容；静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - 闭环 Agent 最小状态模型与校验器（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：基于 `docs/agent/closed_loop_agent_architecture.md` 构建闭环 Agent 的第一层基础能力，在现有三 Agent pipeline 上增加动作规范、世界状态、观察结果和确定性计划校验。
- 验收标准：
  - 后端存在 `ActionSpec`、`WorldState`、`Observation`、`ValidationResult` 等结构
  - 调度计划可被转换为可校验的 action specs
  - Validator 能检查设备存在性、目标仓位、关键点、依赖关系和基础执行约束
  - Agent pipeline 返回闭环相关状态，供前端/用户查看
  - Python 编译检查与前端静态检查通过或记录阻塞原因

## 当前阶段任务清单

- `done` `BE-AGENT-CLOSED-LOOP-043` `P0` `M2`
  在现有 Agent MVP 上实现闭环 Agent 的最小状态模型与确定性校验器，为后续 step-by-step 执行和轮询观察打基础。
  Acceptance Criteria: 新增闭环状态/动作/观察/校验结构；pipeline 输出 action_specs、world_state、validation_result；校验失败能结构化返回；静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - 闭环 Agent 架构规划文档（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：基于当前 prompt-based Agent MVP，总结其边界并规划升级为带计划、校验、执行、观察、重规划循环的闭环 Agent 架构。
- 验收标准：
  - 文档明确解释导师提到的轮询/闭环含义
  - 文档区分当前 MVP 与真正 Agent 系统的差异
  - 文档给出状态模型、动作规范、轮询循环、Agent 职责和落地阶段
  - 文档能作为下一步实现闭环 Agent 的构建依据

## 当前阶段任务清单

- `done` `DOC-AGENT-CLOSED-LOOP-042` `P0` `M2`
  编写闭环 Agent 架构规划文档，将当前三 Agent MVP 升级路径整理为可实现的计划-执行-观察-校验-重规划方案。
  Acceptance Criteria: `docs/agent` 下存在中文规划文档；覆盖轮询机制、状态模型、动作 DSL、Agent 分工、接口事件和实施路线。

## 阶段目标

- 当前阶段：Phase 1 - Intelligent Storage 动画执行接入（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：核查并接入 `Intelligent Storage and Logistics Line` 首例动画，支持 smart_storage 的水平 root 运动、竖直 carrier 抬升和物块代理方块轨迹运动。
- 验收标准：
  - 明确当前项目是否已有 smart_storage 动画执行方案
  - 读取并对齐 Intelligent Storage 的 scene_skills 设备字段
  - smart_storage 动画能根据 rootNodeName / carrierNodeName 分别驱动水平与竖直节点
  - 物块坐标错误时使用包围盒生成代理方块，以底部中心作为轨迹参考点
  - Python 编译检查与前端 lint/typecheck 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `FE-STORAGE-SIM-041` `P0` `M2`
  核查并实现 Intelligent Storage and Logistics Line 的 smart_storage 与物块代理动画执行链路。
  Acceptance Criteria: 能说明现有支持范围；必要动画执行器已落地；物块代理方块以包围盒底部中心对齐轨迹；静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - Behavior 模型加载与轨迹工具等价性核查（M2）
- 阶段周期：2026-05-07，1 天
- 阶段目标：核查当前项目与 behavior 在 GLB 模型加载、scene_skills 注册、轨迹点选取和执行器输入上的差异，确认动画错位是否由加载链路或轨迹工具差异导致，并给出或实施修复。
- 验收标准：
  - 明确当前轨迹点选取来源，是 behavior 工具复用还是当前项目新写适配
  - 对比 behavior 与当前项目的模型加载流程，列出坐标、缩放、节点注册差异
  - 如确认加载方式差异导致动画错误，当前项目改为 behavior 等价加载语义
  - `pnpm run lint` 与 `tsc --noEmit` 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `FE-BEHAVIOR-LOAD-040` `P0` `M2`
  核查并修复 Coordinated Robotic Transfer Unit 的模型加载与轨迹点选取链路，使其尽量与 behavior 的 GLB 加载和轨迹规划工具保持一致。
  Acceptance Criteria: 能说明轨迹点选取方式；能说明加载链路差异；必要修复已落地；前端静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - Behavior 动画执行等价性核对与修复（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：核对当前 Agent 动画执行链路与 behavior 项目在轨迹点生成、坐标空间、R3F 场景加载、机械臂 IK 执行上的差异，修复首例中轨迹点和动作不对齐的问题。
- 验收标准：
  - 明确当前实现与 behavior 是否逐项等价，不再以“百分百复刻”描述未迁移部分
  - 轨迹点坐标空间与 GLB 场景坐标空间一致
  - Coordinated Robotic Transfer Unit 首例的 conveyor 与 robot_arm segment 能按 behavior 的执行语义对齐
  - `pnpm run lint` 与 `tsc --noEmit` 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `FE-BEHAVIOR-PARITY-039` `P0` `M2`
  对照 behavior 的轨迹规划和 R3F 执行链路，修复当前项目首例动画的坐标空间和动作段对齐问题。
  Acceptance Criteria: 当前实现说明清楚哪些部分已复刻、哪些部分仍是适配；首例轨迹点与场景节点坐标一致；前端静态检查通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - Agent 仿真播放与日志同步修复（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：修复 Agent 首例执行链路中 SimPy 日志一次性输出和场景动画不执行的问题，将终端输出改为跟随动画仿真时间依次追加，并按 behavior 中的执行方式迁移首例所需的传送带线性运动、机械臂 IK 映射与执行器。
- 验收标准：
  - Agent SSE 返回的 SimPy/result events 不再在聊天回调中一次性写入终端
  - 前端播放时按照 `executionStartedAt`、`speed` 和事件 `time` 依次追加终端日志
  - Coordinated Robotic Transfer Unit 首例能根据 `execution_plan.segments` 驱动物料移动和机械臂 IK 动作
  - 复用 behavior 的 IK 构建、CCD 求解和仿真执行思路，保持文件行数约束
  - `pnpm run lint` 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `FE-AGENT-SIM-038` `P0` `M2`
  修复 Agent 首例仿真播放链路：将 SimPy 终端日志改为动画时钟驱动的逐条输出，并迁移 behavior 的执行器/IK 动画方式到当前前端。
  Acceptance Criteria: 终端日志按仿真时间依次出现；Coordinated Robotic Transfer Unit 的传送带物料移动和机械臂 IK 动作可由 Agent execution_plan 触发；前端 lint 通过或记录阻塞原因。

## 阶段目标

- 当前阶段：Phase 1 - Qwen 多 Key Agent 配置与首例输入说明（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：为三 Agent 系统补充通义千问多 API key 轮换配置，验证 Coordinated Robotic Transfer Unit 首例可由自然语言输入驱动，并整理用户输入示例。
- 验收标准：
  - 后端支持 `DASHSCOPE_API_KEYS` 逗号分隔多 key 配置
  - Qwen 调用失败时可尝试下一个 key，全部失败后回退 deterministic pipeline
  - 不将真实 API key 写入源码或提交文件
  - 给出可在聊天输入框中使用的仿真输入案例
  - 后端编译检查与前端 lint 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `AGENT-QWEN-037` `P0` `M2`
  接入 Qwen 多 key 轮换配置，验证首例 Agent pipeline，并整理输入框仿真案例。
  Acceptance Criteria: Qwen client 支持多 key 轮换；Coordinated Robotic Transfer Unit pipeline 可运行；用户获得可直接输入的仿真指令示例。

## 阶段目标

- 当前阶段：Phase 1 - Coordinated Robotic Transfer Unit Agent 首例联调（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：将三 Agent 系统跑通到首个 `Coordinated Robotic Transfer Unit` 案例，支持从 `frontend/public/demo/.../scene_skills` 读取场景与设备 skill，预留通义千问 API 配置，前端 Agent 流携带当前加载场景，终端实时接收 mock SimPy 事件。
- 验收标准：
  - 后端 Agent 上下文优先读取 `frontend/public/demo/Coordinated Robotic Transfer Unit/scene_skills`
  - 调度、执行、结果输出三 Agent 均具备通义千问调用入口，未配置 API 时保留可测试回退路径
  - 前端点击加载 Coordinated Robotic Transfer Unit 后保存 agent scene 名称
  - AI 聊天调用 Agent stream 时携带当前 scene 名称
  - Agent stream 的 SimPy/Terminal events 可写入终端状态
  - 后端 Python 编译检查与前端 lint 通过或记录阻塞原因

## 当前阶段任务清单

- `done` `AGENT-FIRSTCASE-036` `P0` `M2`
  跑通 Coordinated Robotic Transfer Unit 首个 Agent 案例：通义千问三 Agent 调用入口、frontend demo scene_skills 读取、前端场景名传递、终端事件接收。
  Acceptance Criteria: 加载 Coordinated Robotic Transfer Unit 后，输入仿真需求可通过 `/api/agent/stream` 返回 schedule/execution/result 事件，并将 SimPy mock 日志写入终端。

## 阶段目标

- 当前阶段：Phase 1 - Agent 系统后端骨架（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：根据 `docs/agent/three_agent_langgraph_architecture.md` 搭建后端 Agent 系统最小闭环，包含调度 Agent、执行 Agent、结果输出 Agent、demo scene_skills 读取、计划时间线生成和 SSE 事件输出。
- 验收标准：
  - 后端新增 `/api/agent/run` 和 `/api/agent/stream` 接口
  - Agent pipeline 能读取 behavior demo 的 `scene_skills/scene.json` 与设备配置
  - 调度 Agent 输出 `schedule_plan`
  - 执行 Agent 输出带 `planned_start` / `planned_end` 的 `execution_plan`
  - 结果输出 Agent 输出 mock SimPy/Terminal events
  - Python 静态语法检查通过

## 当前阶段任务清单

- `done` `BE-AGENT-035` `P0` `M2`
  搭建三 Agent 后端系统骨架，实现调度、执行、结果输出三段 pipeline 和 FastAPI 接口。
  Acceptance Criteria: `/api/agent/run` 可返回 schedule/execution/result 三段结构；`/api/agent/stream` 可返回 SSE 事件流；代码文件满足行数约束；Python 编译检查通过。

## 阶段目标

- 当前阶段：Phase 1 - Agent 协作架构修订（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：将 `docs/agent` 中的三 Agent 架构从场景理解/调度规划/结果生成修订为调度 Agent、执行 Agent、结果输出 Agent，明确基于 `behavior/frontend/public/demo/*/scene_skills/scene.json` 的场景格式、轨迹点生成复用方式，以及时序关系在三类 Agent 中的职责归属。
- 验收标准：
  - `docs/agent/three_agent_langgraph_architecture.md` 反映调度、执行、结果输出三 Agent 架构
  - 文档明确 scene.json 作为场景理解输入格式的使用方式
  - 文档明确执行 Agent 复用 behavior 轨迹点生成能力
  - 文档回答动作时序、持续时间和下一设备启动时间应由哪一层处理

## 当前阶段任务清单

- `done` `DOC-AGENT-034` `P0` `M2`
  修订三 Agent LangGraph 架构规划，将核心职责调整为调度、执行和结果输出，并补充时序关系分层设计。
  Acceptance Criteria: 文档覆盖调度 Agent、执行 Agent、结果输出 Agent 的输入输出、职责边界、共享状态、时序处理原则和第一阶段实现范围。

## 阶段目标

- 当前阶段：Phase 1 - 三 Agent 协作架构规划（M2）
- 阶段周期：2026-05-06，1 天
- 阶段目标：基于 gptwin2 中单 Agent 三阶段 CoT 经验，整理 Agentic Components 的三 Agent LangGraph 协作架构，明确场景理解、调度规划、结果生成三类 Agent 的职责边界、状态契约和实现顺序。
- 验收标准：
  - `docs/agent/` 下新增三 Agent 架构规划文档
  - 文档说明 gptwin2 经验如何迁移到当前项目
  - 文档明确三个 Agent 的输入、输出、职责边界和 LangGraph 流程
  - 文档给出第一阶段可落地实现范围

## 当前阶段任务清单

- `done` `DOC-AGENT-033` `P0` `M2`
  编写三 Agent 协作架构规划文档，将 gptwin2 的场景理解、动作规划、DSL 生成三阶段经验迁移为当前项目的场景理解 Agent、调度规划 Agent、结果生成 Agent 设计。
  Acceptance Criteria: `docs/agent/` 下存在中文规划文档，覆盖三个 Agent 的职责、输入输出、共享状态、LangGraph 编排方式和第一阶段实现范围。

## 阶段目标

- 当前阶段：Phase 1 - 视口相机稳定性修复（M2）
- 阶段周期：2026-04-28，1 天
- 阶段目标：移除 3D 视口中由场景对象变化触发的自动相机重置，确保移动、旋转、缩放、新增或删除模型时用户视角保持不变。
- 验收标准：
  - 拖动物体位置时相机位置与 OrbitControls target 不被自动重置
  - 新增或删除模型时不触发相机自动重新取景
  - `pnpm run lint` 通过

## 当前阶段任务清单

- `done` `FE-VIEWPORT-CAMERA-032` `P0` `M2`
  移除视口相机对场景模型列表和模型 transform 变化的自动响应，保留用户手动控制视角。
  Acceptance Criteria: 移动、旋转、缩放、新增或删除模型时视角保持当前用户设置；前端 lint 通过。

## 执行补充（2026-04-27）

- 阶段目标：Phase 1 - 前端公共模型交互增强（M2）
- 阶段周期：2026-04-27
- 阶段目标说明：支持多个 GLB 模型持续加载到同一场景，并支持选中单个模型后执行平移、旋转、缩放。
- 验收标准：
  - 从左侧目录连续点击多个模型时，场景会追加多个实例而不是替换旧实例
  - 点击任意场景模型后可显示变换控件，并支持平移、旋转、缩放
  - 变换结果会同步回场景状态

- `done` `FE-VIEWPORT-031` `P0` `M2`
  支持多 GLB 模型入场、实例选中与平移/旋转/缩放交互。
  Acceptance Criteria: 连续加载多个模型后场景内保留多个实例；选中实例后可切换 translate / rotate / scale；变换后模型位置姿态和缩放状态保持正确。

## 阶段目标

- 当前阶段：Phase 1 - 前端公共模型接入（M2）
- 阶段周期：2026-04-27，1 天
- 阶段目标：将工作区左侧收藏面板中的“公共模型”接入本地 Supabase Storage，按 `Components` 与 `Layouts` 两类展示，并支持点击模型后在中间场景区域加载对应模型。
- 验收标准：
  - 前端可从 Supabase 公共桶读取模型列表与基础元数据
  - 收藏面板中的“公共模型”可分组展示 `Components` 与 `Layouts`
  - 点击模型卡片后，中间场景会切换或加载对应模型
  - `pnpm run lint` 通过

## 当前阶段任务清单

- `done` `FE-VIEWPORT-FIT-030` `P0` `M2`
  为 R3F 视口增加模型包围盒居中、自动缩放与相机自适应能力，提升不同 `.glb` 模型的默认可视体验。
  Acceptance Criteria: 点击不同公共模型时，模型会自动居中并缩放到合适尺寸；相机视角能覆盖主要模型范围；`pnpm run lint` 通过。
- `done` `FE-R3F-VIEWPORT-029` `P0` `M2`
  将中间场景区从 mock 2D 占位图升级为基于 Three.js + React Three Fiber 的真实 3D 视口，并支持从 Supabase `modles` 桶加载 `.glb` 模型。
  Acceptance Criteria: 前端依赖包含 `three`、`@react-three/fiber`、`@react-three/drei`；点击公共模型后中间区域能显示真实 3D 模型；`pnpm run lint` 通过。
- `done` `FE-SUPABASE-PROXY-028` `P0` `M2`
  为公共模型目录增加前端服务端代理读取能力，修复匿名 key 无法列出 Storage 对象的问题，并支持 `Components` 多层目录展开。
  Acceptance Criteria: 前端通过服务端接口可读取 `modles/Layouts` 和 `modles/Components/*`；收藏树可展示 `Components` 的子分类与模型数量；`pnpm run lint` 通过。
- `done` `FE-SUPABASE-CATALOG-027` `P0` `M2`
  接入 Supabase 公共模型目录与场景加载链路，完成收藏树分类、模型列表渲染和点击加载到场景的前端实现。
  Acceptance Criteria: 收藏面板可展示来自 Supabase 的 `Components` 与 `Layouts` 模型；点击任一模型后场景区与当前选中状态同步更新；前端 lint 通过。

## 阶段目标

- 当前阶段：Phase 1 - 本地 Supabase 部署（M2）
- 阶段周期：2026-04-23，1 天
- 阶段目标：在本机通过 Supabase CLI 和 Docker 启动本地 Supabase stack，并补齐项目所需的本地 schema、环境变量与启动说明。
- 验收标准：
  - 仓库存在 `supabase/` 本地配置目录
  - 本地 Supabase stack 可通过 CLI 启动
  - 本地数据库包含后端所需的 `users` 表结构
  - 前后端 `.env.example` 或说明文档包含本地 Supabase 默认地址与密钥使用方式

## 当前阶段任务清单

- `done` `AUTH-CALLBACK-026` `P0` `M2`
  补齐 Supabase OAuth 回调 route，将 provider 返回的 code 交换为 Supabase session cookie 后再跳转业务页面。
  Acceptance Criteria: GitHub/Google OAuth 返回后不再回到登录页，服务端页面可读取 Supabase session。

- `done` `INFRA-SUPABASE-LOCAL-025` `P0` `M2`
  使用 Supabase CLI 初始化并启动本地 Supabase，补齐本地迁移与环境配置说明。
  Acceptance Criteria: `supabase start` 可启动本地服务，项目可按本地 Supabase 地址配置前后端。

## 阶段目标

- 当前阶段：Phase 1 - 后端认证死代码清理（M2）
- 阶段周期：2026-04-21，1 天
- 阶段目标：移除后端自建 OAuth exchange、refresh token 与桥接认证遗留实现，完成 Supabase 鉴权单轨收口。
- 验收标准：
  - `/api/auth` 仅保留 Supabase 鉴权所需的默认接口
  - `oauth_accounts`、`refresh_tokens` 相关模型和服务代码不再参与默认后端启动链路
  - 后端配置与 README 不再把自签 token 体系作为默认方案
  - Python 语法检查通过

## 当前阶段任务清单

- `done` `AUTH-DEADCODE-024` `P0` `M2`
  删除后端旧认证接口、自签 token 服务与关联模型引用，保留 Supabase token -> 本地 users 同步的单一路径。
  Acceptance Criteria: 后端默认代码路径中不再保留 exchange/refresh 认证实现，静态检查通过。

## 阶段目标

- 当前阶段：Phase 1 - 认证遗留清理（M2）
- 阶段周期：2026-04-21，1 天
- 阶段目标：移除前端默认路径中的 NextAuth 与自建 token exchange 遗留实现，统一仓库认证叙事到 Supabase Auth。
- 验收标准：
  - `frontend` 不再依赖 `next-auth`
  - NextAuth API route、类型扩展与旧认证辅助文件从默认工程中移除
  - 前后端文档与模板不再把 `AUTH_BRIDGE_SECRET`、`BACKEND_API_URL` 作为默认认证入口
  - 前端 lint 通过

## 当前阶段任务清单

- `done` `AUTH-CLEANUP-023` `P0` `M2`
  清理 NextAuth 与旧桥接认证遗留文件、依赖和说明文案，完成 Supabase Auth 单轨收口。
  Acceptance Criteria: 前端依赖和源码默认路径中不再保留 NextAuth 链路，相关文档与模板完成同步更新。

## 阶段目标

- 当前阶段：Phase 1 - Supabase 后端鉴权迁移（M2）
- 阶段周期：2026-04-21，1 天
- 阶段目标：将后端默认鉴权入口从自签 access token 校验切换为 Supabase access token 校验，并在访问受保护接口时自动同步本地用户资料。
- 验收标准：
  - `GET /api/auth/me` 默认接受 Supabase access token
  - 后端可基于 Supabase JWT 解析当前用户并同步到本地 `users` 表
  - `backend/.env.example` 与配置对象包含后端 Supabase JWT 校验所需变量
  - 后端静态校验通过，旧 bridge/token exchange 链路明确降级为过渡实现

## 当前阶段任务清单

- `done` `AUTH-SUPABASE-BE-022` `P0` `M2`
  改造后端鉴权依赖与用户同步逻辑，使受保护接口默认基于 Supabase access token 工作，并为后续移除自建 token 体系做收口。
  Acceptance Criteria: 后端依赖、配置与 `/api/auth/me` 鉴权链路完成 Supabase 化，旧实现仅保留兼容用途。

## 阶段目标

- 当前阶段：Phase 1 - Supabase Auth 迁移（M2）
- 阶段周期：2026-04-21，1 天
- 阶段目标：将前端登录、会话读取、路由保护与后端鉴权入口从 NextAuth + 自建 token exchange 迁移到 Supabase Auth 主导模式。
- 验收标准：
  - 前端登录入口和路由保护不再依赖 `next-auth` 的 `appAccessToken`
  - 前端环境变量与认证说明以 Supabase Auth 为默认路径
  - 后端为后续校验 Supabase access token 预留明确配置入口
  - 现有自建 auth 链路不再作为默认推荐实现

## 当前阶段任务清单

- `done` `AUTH-SUPABASE-021` `P0` `M2`
  重构前端认证入口、会话读取与登录说明，切换到 Supabase Auth 作为默认登录态来源，并为后端 Supabase JWT 校验改造铺路。
  Acceptance Criteria: 登录页、首页、项目页、工作区页面的鉴权判断完成 Supabase 化，环境模板与文案同步更新。

## 阶段目标

- 当前阶段：Phase 1 - Supabase 基础设施迁移（M2）
- 阶段周期：2026-04-21，1 天
- 阶段目标：将当前本地部署中的 PostgreSQL 与 MinIO 接入统一切换为 Supabase，完成数据库连接、对象存储配置、部署说明与环境变量模板收敛。
- 验收标准：
  - `docker-compose.yml` 不再依赖本地 `postgres`、`minio`、`pgadmin` 服务即可启动核心开发链路。
  - 后端数据库配置可通过 Supabase PostgreSQL 连接串直连。
  - 前后端环境变量模板补充 Supabase 所需配置，并移除本地 MinIO/PostgreSQL 的误导性默认说明。
  - 项目文档明确 Supabase 的数据库与 Storage 使用方式、启动方式与迁移注意事项。

## 当前阶段任务清单

- `done` `INFRA-SUPABASE-020` `P0` `M2`
  梳理并替换本地 PostgreSQL / MinIO 部署依赖，统一收敛到 Supabase 的 PostgreSQL 与 Storage 配置入口。
  Acceptance Criteria: 部署配置、环境变量模板与说明文档完成 Supabase 化，仓库内不再要求本地 postgres/minio/pgadmin 作为默认依赖。

## 阶段目标

- 当前阶段：Phase 1 - AI 层架构文档补充（M1）
- 阶段周期：2026-04-20，1 天
- 阶段目标：补充一份独立的 AI 层架构设计文档，聚焦 Agent 调度、Skill 集成、SimPlan 协议边界以及与仿真执行层的协作方式。
- 验收标准：
  - 新增一份中文 AI 架构文档，独立于主设计稿维护。
  - 文档包含 AI 层分层说明、Agent Scheduler 设计、Skill 组织方式和至少一张框架图。
  - 文档写清从用户请求到 SimPlan 生成、再到执行层落地的完整流程。
  - 文档明确 AI 服务与 Skill 服务、仿真服务之间的通信职责与协议建议。

## 当前阶段任务清单

- `done` `DOC-AI-019` `P1` `M1`
  编写 AI 层架构与 Agent 调度设计文档，整理 Agent Scheduler、Skill Registry、SimPlan 协议、执行协作流程与框架图。
  Acceptance Criteria: 新文档可作为 AI 层专题设计说明，便于后续拆分 Agent 服务、Skill 服务与执行服务。

## 阶段目标

- 当前阶段：Phase 1 - 微服务架构文档补充（M1）
- 阶段周期：2026-04-20，1 天
- 阶段目标：基于 `docs/` 中现有设计内容，整理项目的微服务架构图、服务间协作流程以及通信方式/协议说明。
- 验收标准：
  - 新增一份中文架构文档，明确微服务边界与职责。
  - 文档包含至少一张可直接阅读的文字架构图。
  - 文档写清前端、网关、认证、场景、目录、Agent、仿真、文件、消息/缓存、数据库之间的协作流程。
  - 文档明确 REST、SSE、WebSocket、Redis Pub/Sub、Celery、数据库访问等协议与通信方式。

## 当前阶段任务清单

- `done` `DOC-ARCH-018` `P1` `M1`
  编写微服务架构与协作流程文档，整合前端、后端、AI、数据库设计中的服务边界、交互链路和通信协议。
  Acceptance Criteria: 新文档可作为项目微服务架构总览，便于后续服务拆分、接口设计和部署规划。

## 阶段目标

- 当前阶段：Phase 1 - 项目 README 重构（M1）
- 阶段周期：2026-04-20，1 天
- 阶段目标：重写根目录 README，清晰说明项目最终目标、与 Visual Components 的对标关系、旧版 agent 动画引擎的继承价值，以及当前项目的开发状态。
- 验收标准：
  - README 包含项目定位、目标能力、当前进度、系统构成和路线图。
  - README 嵌入 `docs/assets/VC.png`、`docs/assets/curr.png`、`docs/assets/old.png` 三张对比图。
  - README 明确说明旧项目已具备 agent 驱动动画引擎，本项目是在其基础上重建新一代 agent 平台。

## 当前阶段任务清单

- `done` `DOC-README-017` `P1` `M1`
  重写根目录 README，补充产品愿景、平台对标关系、三张截图说明、当前能力边界与后续演进方向。
  Acceptance Criteria: 根 README 可作为项目首页说明文档，图文完整，叙事清晰，能让新成员快速理解项目目标与当前状态。

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

- 2026-04-27：完成 `FE-VIEWPORT-FIT-030`，R3F 视口已支持 GLB 包围盒居中、统一缩放与基础相机自适应，对不同尺寸模型的默认观感更稳定，`corepack pnpm run lint` 通过。
- 2026-04-27：完成 `FE-R3F-VIEWPORT-029`，前端已接入 `three`、`@react-three/fiber`、`@react-three/drei`，公共模型目录项返回 `modelUrl` 并可在中间视口加载真实 `.glb` 模型，`corepack pnpm run lint` 通过。
- 2026-04-27：完成 `FE-SUPABASE-PROXY-028`，新增前端服务端目录代理接口以读取 `modles` 桶，修复匿名 key 无法列出 Storage 对象的问题，并支持 `Components` 多层目录分类展示，`corepack pnpm run lint` 通过。
- 2026-04-27：完成 `FE-SUPABASE-CATALOG-027`，前端收藏面板已接入 Supabase Storage 公共模型目录，支持按 `Components` / `Layouts` 分组展示并点击加载到场景，`corepack pnpm run lint` 通过。
- 2026-04-23：完成 `AUTH-CALLBACK-026`，新增 Supabase OAuth callback route，将 provider 返回的 `code` 交换为 session cookie 后再跳转 `/projects`，前端 lint 通过。
- 2026-04-23：完成 `INFRA-SUPABASE-LOCAL-025`，本地 Supabase CLI + Docker stack 已启动，新增 `supabase/` 配置、`users` 表 migration、本地环境变量模板与 `docs/local_supabase.md`。
- 2026-04-21：完成 `AUTH-DEADCODE-024`，后端已移除旧 exchange/refresh 认证链路与关联模型引用，Python 语法检查通过。
- 2026-04-21：完成 `AUTH-CLEANUP-023`，前端默认工程已移除 NextAuth 与旧桥接认证遗留文件和依赖，`pnpm lint` 通过。
- 2026-04-21：完成 `AUTH-SUPABASE-BE-022`，后端默认鉴权入口已支持 Supabase access token 并在访问受保护接口时同步本地 `users`，Python 语法检查通过。
- 2026-04-21：完成 `AUTH-SUPABASE-021`，前端登录入口、服务器端会话读取与受保护页面默认切换到 Supabase Auth，`pnpm lint` 已通过。
- 2026-04-21：完成 `INFRA-SUPABASE-020`，默认部署说明已切换为 Supabase PostgreSQL + Supabase Storage，本地 docker-compose 不再默认依赖 postgres/minio/pgadmin。
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
