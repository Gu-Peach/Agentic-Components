from typing import Any

from pydantic import BaseModel


class AgentRunRequest(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    message: str
    scene_name: str = 'Intelligent Storage and Logistics Line'
    scene_skill_path: str | None = None
    session_id: str = 'default'


class AgentRunResponse(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    success: bool
    session_id: str
    schedule_plan: dict[str, Any]
    execution_plan: dict[str, Any]
    result_events: list[dict[str, Any]]
    final_response: str


class AgentStreamChunk(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    type: str
    data: dict[str, Any]
