# 闭环 Agent 架构升级规划

## 1. 背景与判断

当前项目已经完成了一个可运行的 Agent MVP：用户输入自然语言，后端读取 `scene_skills/scene.json` 与 `devices/*.json`，调度 Agent 生成动作序列，执行 Agent 生成轨迹与时间线，结果输出 Agent 生成 SimPy/Terminal 事件，前端根据 `execution_plan` 播放动画。

这个阶段的价值很明确：它证明了 `scene_skills`、LLM 调度、确定性轨迹生成、SimPy 日志和前端动画之间可以形成闭环展示。但是从严格意义上看，它仍然更接近“基于 prompt 的规划流水线”，还不是完整的自主 Agent 系统。

导师提到的“轮询”可以理解为：Agent 不能只在执行前生成一次计划，而要在执行前、执行中和执行后持续读取系统状态，检查当前动作是否满足规范，并在偏离预期时触发修正或重规划。

推荐目标是从：

```text
一次性 Prompt -> 一次性计划 -> 一次性执行
```

升级为：

```text
计划 -> 校验 -> 执行一步 -> 观察状态 -> 判断结果 -> 继续/重试/重规划
```

也就是一个具备状态、工具、反馈和重规划能力的闭环 Agent。

## 2. 当前 MVP 与真正 Agent 的差异

| 维度 | 当前 MVP | 闭环 Agent 目标 |
| --- | --- | --- |
| 计划方式 | 一次性生成完整计划 | 分阶段生成，可校验、可修正 |
| 执行方式 | 前端按完整 `execution_plan` 播放 | 按 step 执行，每步等待状态反馈 |
| 状态感知 | 主要依赖输入 JSON | 持续读取设备、物块、SimPy、动画状态 |
| 错误处理 | 多数错误表现为动画偏差或日志异常 | Agent 能识别失败并选择重试、跳过或重规划 |
| 记忆 | 会话级输入输出 | 维护世界状态、资源状态、物块位置和历史动作 |
| 自主性 | LLM 生成结构化 JSON | Agent 根据观察结果动态决策下一步 |
| 规范约束 | 主要在 prompt 中描述 | 用 action schema、precondition、effect、validator 显式表达 |

因此，当前系统不是“错的”，而是处于第一阶段：它已经有 Agent 的接口形态和规划能力，但还缺少闭环控制。

## 3. 闭环 Agent 的核心循环

建议把“轮询”定义为一个受控的执行循环，而不是简单地反复问大模型。

```text
1. Planner 生成候选动作计划
2. Validator 校验计划是否满足设备能力、场景拓扑、时序和资源约束
3. Executor 提交当前 step 执行
4. Monitor 轮询执行状态
5. Critic 判断实际状态是否满足 step 的 expected_effect
6. 如果满足，提交下一 step
7. 如果不满足，根据失败类型 retry / repair / replan / ask_user
8. Result Agent 持续输出日志、解释和最终总结
```

轮询的对象不是 LLM 本身，而是系统状态：

- 当前动画时间
- 当前 SimPy 时间
- 当前 active segment
- 设备状态，例如 `idle`、`moving`、`blocked`、`done`
- 物块位置，例如 `object_at = conveyor_1.exit`
- 资源占用，例如 `storage.A1 = occupied`
- 执行事件，例如 `segment_started`、`waypoint_reached`、`segment_completed`
- 异常事件，例如 `node_missing`、`trajectory_out_of_range`、`timeout`

## 4. Agent 职责拆分

### 4.1 Supervisor Agent

Supervisor 是闭环的总控节点，负责决定下一步走向。

输入：

- 当前 `AgentState`
- 最新 `Observation`
- 最新 `ValidationResult`
- 用户目标

输出：

- `continue`
- `retry_step`
- `repair_plan`
- `replan`
- `ask_user`
- `finish`

它不直接生成轨迹，也不直接控制动画，而是决定系统状态机的下一条边。

### 4.2 Planning Agent

Planning Agent 负责把用户目标转为规范化计划。

第一阶段仍可沿用现有调度 Agent，但输出需要升级为带显式约束的动作列表：

```json
{
  "action_id": "a2",
  "device_id": "smart_storage_1",
  "action": "move_to_storage_cell",
  "params": {
    "targetCellId": "A1",
    "storageId": "storage"
  },
  "preconditions": [
    { "type": "object_at", "object": "object", "location": "conveyor_1.exit" },
    { "type": "device_idle", "device": "smart_storage_1" },
    { "type": "cell_empty", "cell": "storage.A1" }
  ],
  "expected_effects": [
    { "type": "object_at", "object": "object", "location": "storage.A1" },
    { "type": "cell_occupied", "cell": "storage.A1" }
  ],
  "depends_on": ["a1"]
}
```

### 4.3 Validation Agent / Validator Node

Validator 不应该完全依赖 LLM。建议优先使用确定性校验函数，LLM 只负责解释问题或提出修复建议。

校验内容：

- action schema 是否完整
- `device_id` 是否存在
- action 是否被设备类型支持
- `targetCellId` 是否存在
- keyPoint 是否能解析
- 轨迹点是否为空
- motion range 是否越界
- 时序依赖是否形成环
- 同一资源是否被并发占用
- 预期 effect 是否可被观察系统验证

输出示例：

```json
{
  "passed": false,
  "errors": [
    {
      "code": "CELL_NOT_FOUND",
      "action_id": "a2",
      "message": "storage 中不存在目标仓位 A9"
    }
  ],
  "repair_hint": "将 targetCellId 替换为存在的空闲仓位"
}
```

### 4.4 Execution Agent

Execution Agent 负责把通过校验的 action 转换成可执行 step。

职责：

- 调用确定性轨迹生成工具
- 生成 `execution_segment`
- 计算 `planned_start` / `planned_end`
- 标注 `motionData`
- 将单个 step 提交给前端动画和 SimPy runtime

升级重点是：Execution Agent 不再一次性把所有动作扔给前端播放，而是可以按 step 提交。

### 4.5 Monitor Agent / Observation Node

Monitor 负责轮询或订阅执行状态。它可以不是 LLM，而是一个状态采集器。

推荐观察事件：

```json
{
  "type": "observation",
  "session_id": "s1",
  "sim_time": 7.8,
  "active_action_id": "a2",
  "active_segment_id": "seg_smart_storage_1_a2",
  "devices": {
    "smart_storage_1": {
      "state": "moving",
      "rootPosition": -1.2,
      "carrierPosition": 1.6
    }
  },
  "objects": {
    "object": {
      "location": "in_motion",
      "position": { "x": -1.2, "y": 1.6, "z": -0.78 }
    }
  },
  "events": ["waypoint_reached"]
}
```

### 4.6 Critic Agent

Critic 判断执行结果是否满足 `expected_effects`。

第一阶段可以先做确定性判断：

- segment 是否 completed
- object 当前位置是否接近目标点
- device 是否回到 idle
- storage cell 状态是否更新
- 是否发生 timeout / node_missing / range_error

LLM Critic 可以作为第二阶段，用来解释复杂失败原因。

### 4.7 Result Agent

Result Agent 继续保留，负责输出：

- Agent 规划摘要
- 校验结果
- 执行过程日志
- 观察状态变化
- 异常解释
- 最终报告

它不直接修改计划，只报告和解释。如果发现异常，应把异常写回 `AgentState`，交给 Supervisor 决策。

## 5. 共享状态模型

闭环 Agent 的关键是维护一个显式状态，而不是只传递 prompt 文本。

建议状态分为四层。

### 5.1 Scene State

来自 `scene_skills` 和前端 R3F scene registry。

```json
{
  "scene_name": "Intelligent Storage and Logistics Line",
  "devices": {
    "conveyor_1": { "type": "conveyor", "keyPoints": {} },
    "smart_storage_1": { "type": "smart_storage", "motion": {} },
    "storage": { "type": "storage", "grid": {} }
  }
}
```

### 5.2 World State

描述仿真世界当前事实。

```json
{
  "objects": {
    "object": {
      "location": "conveyor_1.entry",
      "position": { "x": 0.366, "y": 0.7, "z": 3.832 }
    }
  },
  "storage": {
    "A1": "empty",
    "A2": "empty"
  },
  "devices": {
    "conveyor_1": "idle",
    "smart_storage_1": "idle"
  }
}
```

### 5.3 Plan State

描述计划、当前 action 和重试次数。

```json
{
  "plan_id": "plan_001",
  "actions": [],
  "current_action_index": 0,
  "retry_count": 0,
  "status": "validating"
}
```

### 5.4 Runtime State

描述实际执行状态。

```json
{
  "sim_time": 12.5,
  "animation_time": 12.5,
  "active_segment_id": "seg_smart_storage_1_a2",
  "last_event": "waypoint_reached",
  "errors": []
}
```

## 6. 动作规范

为了让系统从 prompt-based 变成 agentic，需要把动作从自然语言描述升级为可验证契约。

推荐 `ActionSpec`：

```json
{
  "action_id": "a1",
  "device_id": "conveyor_1",
  "action_type": "transport",
  "params": {},
  "resources": ["object"],
  "preconditions": [],
  "expected_effects": [],
  "failure_conditions": [
    { "type": "timeout", "seconds": 10 },
    { "type": "node_missing", "node": "Conveyor(1)" }
  ],
  "retry_policy": {
    "max_retries": 1,
    "on_fail": "replan"
  }
}
```

每个设备类型应有自己的 action 模板。

### 6.1 Conveyor Action

```json
{
  "action_type": "transport_to_exit",
  "required_keypoints": ["entry", "exit"],
  "expected_effects": [
    { "type": "object_at", "location": "conveyor.exit" }
  ]
}
```

### 6.2 Robot Arm Action

```json
{
  "action_type": "pick_and_place",
  "required": ["pick", "place"],
  "expected_effects": [
    { "type": "object_at", "location": "place" }
  ]
}
```

### 6.3 Smart Storage Action

```json
{
  "action_type": "move_to_storage_cell",
  "required": ["rootNodeName", "carrierNodeName", "targetCellId"],
  "expected_effects": [
    { "type": "object_at", "location": "storage.cell" },
    { "type": "cell_occupied", "cell": "targetCellId" }
  ]
}
```

## 7. LangGraph 形态

推荐把现有三 Agent 放进更大的闭环图中：

```text
START
  -> context_loader
  -> planning_agent
  -> plan_validator
  -> route_after_validation

route_after_validation:
  passed -> execution_agent
  failed_repairable -> planning_agent
  failed_need_user -> ask_user

execution_agent
  -> submit_step
  -> monitor_observation
  -> critic
  -> supervisor_route

supervisor_route:
  effect_satisfied -> next_action_or_finish
  retryable_failure -> execution_agent
  plan_failure -> planning_agent
  need_user -> ask_user
  complete -> result_agent

result_agent
  -> END
```

第一阶段可以不真正引入完整 LangGraph runtime，先在现有后端 pipeline 中实现等价状态机；等验证稳定后再迁移到 LangGraph。

## 8. 前后端接口建议

### 8.1 后端到前端：提交单步执行

```json
{
  "type": "execute_step",
  "session_id": "s1",
  "action_id": "a2",
  "segment": {
    "id": "seg_smart_storage_1_a2",
    "algorithm": "smart_storage_grid",
    "waypoints": [],
    "motionData": {}
  }
}
```

### 8.2 前端到后端：状态观察

```json
{
  "type": "step_observation",
  "action_id": "a2",
  "segment_id": "seg_smart_storage_1_a2",
  "status": "completed",
  "sim_time": 17.8,
  "objects": {
    "object": {
      "position": { "x": -3.306, "y": 2.795, "z": -0.78 }
    }
  },
  "events": ["segment_completed"]
}
```

第一阶段可以用 SSE 输出计划和日志，用 REST 轮询状态。后续再升级为 WebSocket 双向通信。

## 9. 轮询策略

轮询不应该无限制高频调用 LLM。建议分三层：

### 9.1 高频前端帧状态

由前端本地 `requestAnimationFrame` 或 R3F `useFrame` 维护，不传给 LLM。

频率：每帧。

用途：动画播放、物块位置更新、设备节点位置更新。

### 9.2 中频 Runtime Observation

由前端或仿真 runtime 每隔固定时间上报。

频率：100ms 到 500ms。

用途：判断 segment 是否完成、是否超时、是否触发关键事件。

### 9.3 低频 Agent Decision

只有当 step 完成、校验失败、超时或用户中断时，才让 Supervisor/LLM 决策。

频率：事件驱动。

用途：继续下一步、重试、重规划、询问用户。

## 10. 第一阶段实现范围

建议第一阶段不要一口气实现完整复杂系统，而是补一个最小闭环：

1. `ActionSpec` schema
2. `PlanValidator`
3. `WorldState`
4. 前端执行完成事件
5. 后端按 action step 推进
6. 简单 `SupervisorRoute`
7. 失败时返回明确错误，不自动复杂重规划

可落地目标：

```text
用户输入
  -> 生成 action plan
  -> 校验 action plan
  -> 生成第一个 execution segment
  -> 前端播放
  -> 前端返回 segment_completed
  -> 后端更新 WorldState
  -> 后端生成下一个 segment
  -> 全部完成后输出 result
```

这已经能明显区别于当前“一次性计划，一次性播放”的 prompt-based MVP。

## 11. 第二阶段实现范围

第二阶段加入更强的 agentic 能力：

- 自动 repair：缺少 keyPoint 时尝试用包围盒或 scene registry 推断
- 自动 replan：目标仓位不可用时选择下一个空仓位
- timeout 检测：动画超过计划时间未完成则中断
- resource lock：同一物块、同一仓位、同一设备不能被并发动作占用
- human-in-the-loop：关键参数缺失时暂停询问用户

## 12. 第三阶段实现范围

第三阶段再引入完整 LangGraph、持久化和多 Agent 协作：

- LangGraph `StateGraph`
- Redis/Postgres checkpointer
- Plan history
- Observation history
- 多方案对比
- 运行后指标分析
- Optimization Agent

## 13. 与导师评价的回应方式

可以这样概括当前系统和下一步计划：

```text
当前版本是一个可运行的 Agent MVP，已经把自然语言输入、场景理解、
调度计划、轨迹生成、SimPy 日志和前端动画串起来。

但当前版本主要还是一次性 prompt planning，不具备完整的感知、校验、
执行反馈和重规划循环。因此下一步将升级为闭环 Agent：
用显式 ActionSpec 约束动作，用 Validator 校验计划，用 Monitor 轮询
执行状态，用 Critic 判断 expected_effect 是否达成，再由 Supervisor
决定继续执行、重试、修复或重规划。
```

这个回应既承认当前不足，也能说明已有工作是闭环系统的基础。

## 14. 设计原则

- LLM 不直接控制动画节点，只生成或修正规范化计划。
- 轨迹、IK、smart_storage 运动继续由确定性工具负责。
- 每个 action 必须有 preconditions 和 expected_effects。
- 轮询状态优先由程序处理，只有决策点才调用 LLM。
- 前端动画不是黑盒，必须回传 step 状态。
- SimPy 日志不是纯展示，应成为 Agent observation 的一部分。
- 失败不是只写日志，而要进入 retry / repair / replan 分支。

## 15. 推荐下一步任务

接下来可以按以下顺序构建：

1. 定义 `ActionSpec`、`WorldState`、`Observation`、`ValidationResult` 数据结构。
2. 为当前两个 demo 生成 action plan，并添加确定性 validator。
3. 修改前端 simulation store，增加 `segment_completed` / `segment_failed` 回调。
4. 修改后端 pipeline，从一次性返回 `execution_plan` 改为可 step-by-step 推进。
5. 增加 Supervisor route，先实现 `continue`、`fail`、`finish` 三种分支。
6. 在日志中显示闭环状态，例如 `plan_validated`、`step_started`、`observation_received`、`effect_satisfied`。

