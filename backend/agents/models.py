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
    execution_plan: dict[str, Any] | None = None
    result_events: list[dict[str, Any]] = field(default_factory=list)
    final_response: str | None = None
    validation_errors: list[str] = field(default_factory=list)
