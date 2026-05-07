from dataclasses import dataclass, field
from typing import Any


Position = dict[str, float]


@dataclass
class AgentContext:
    scene_root: str
    scene_graph: dict[str, Any]
    device_configs: dict[str, dict[str, Any]]


@dataclass
class AgentState:
    session_id: str
    project_id: str
    user_message: str
    scene_skill_path: str
    scene_graph: dict[str, Any]
    device_configs: dict[str, dict[str, Any]]
    schedule_plan: dict[str, Any] | None = None
    action_specs: list[dict[str, Any]] = field(default_factory=list)
    world_state: dict[str, Any] = field(default_factory=dict)
    validation_result: dict[str, Any] = field(default_factory=dict)
    execution_plan: dict[str, Any] | None = None
    observations: list[dict[str, Any]] = field(default_factory=list)
    result_events: list[dict[str, Any]] = field(default_factory=list)
    final_response: str | None = None
    validation_errors: list[str] = field(default_factory=list)
