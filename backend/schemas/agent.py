from typing import Any

from pydantic import AliasChoices, BaseModel, Field


class AgentRunRequest(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    message: str
    scene_name: str = Field(
        default='Intelligent Storage and Logistics Line',
        validation_alias=AliasChoices('scene_name', 'sceneName'),
    )
    scene_skill_path: str | None = Field(
        default=None,
        validation_alias=AliasChoices('scene_skill_path', 'sceneSkillPath'),
    )
    session_id: str = Field(
        default='default',
        validation_alias=AliasChoices('session_id', 'sessionId'),
    )


class AgentRunResponse(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    success: bool
    session_id: str
    schedule_plan: dict[str, Any]
    action_specs: list[dict[str, Any]] = Field(default_factory=list)
    world_state: dict[str, Any] = Field(default_factory=dict)
    validation_result: dict[str, Any] = Field(default_factory=dict)
    execution_plan: dict[str, Any]
    observations: list[dict[str, Any]] = Field(default_factory=list)
    result_events: list[dict[str, Any]]
    final_response: str


class AgentStreamChunk(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    type: str
    data: dict[str, Any]


class AgentObservationRequest(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    session_id: str = Field(validation_alias=AliasChoices('session_id', 'sessionId'))
    action_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices('action_id', 'actionId'),
    )
    segment_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices('segment_id', 'segmentId'),
    )
    status: str = 'completed'
    sim_time: float = Field(
        default=0,
        validation_alias=AliasChoices('sim_time', 'simTime'),
    )
    events: list[str] = Field(default_factory=list)
    objects: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class AgentStepResponse(BaseModel):
    model_config = {'extra': 'allow', 'populate_by_name': True}

    success: bool
    session_id: str
    source_session_id: str
    status: str
    route: str
    current_index: int
    total_steps: int
    current_step: dict[str, Any] | None = None
    observations: list[dict[str, Any]] = Field(default_factory=list)
    received_observations: list[dict[str, Any]] = Field(default_factory=list)
    message: str = ''
