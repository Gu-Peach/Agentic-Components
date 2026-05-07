from typing import Any

from agents.closed_loop import (
    build_action_specs,
    build_observations,
    build_world_state,
    validate_closed_loop,
)
from agents.closed_loop.clarifier import detect_missing_requirements
from agents.closed_loop.observations import build_status_events
from agents.context import load_agent_context
from agents.execution import ExecutionAgent
from agents.models import AgentState
from agents.qwen import QwenAgentClient
from agents.results import ResultOutputAgent
from agents.scheduling import SchedulingAgent


class AgentPipeline:
    def __init__(self) -> None:
        llm = QwenAgentClient()
        self.scheduler = SchedulingAgent(llm)
        self.executor = ExecutionAgent(llm)
        self.result_output = ResultOutputAgent(llm)

    def run(
        self,
        *,
        session_id: str,
        message: str,
        scene_name: str,
        scene_skill_path: str | None,
    ) -> dict[str, Any]:
        context = load_agent_context(scene_name, scene_skill_path)
        state = AgentState(
            session_id=session_id,
            project_id=scene_name,
            user_message=message,
            scene_skill_path=context.scene_root,
            scene_graph=context.scene_graph,
            device_configs=context.device_configs,
        )

        state.clarification_result = detect_missing_requirements(state)
        if state.clarification_result.get('required'):
            state.schedule_plan = {'intent': 'clarification_required', 'actions': []}
            state.world_state = build_world_state(state.device_configs, [])
            state.validation_result = {'passed': True, 'warnings': []}
            state.final_response = state.clarification_result.get('message', '')
            return self._result(state, status='clarification_required')

        state.schedule_plan = self.scheduler.run(state)
        state.action_specs = build_action_specs(state.schedule_plan)
        state.world_state = build_world_state(
            state.device_configs,
            state.action_specs,
        )
        state.validation_result = validate_closed_loop(
            state.action_specs,
            state.device_configs,
        )
        if not state.validation_result.get('passed'):
            state.validation_errors = state.validation_result.get('errors', [])
            state.result_events = build_status_events(state.validation_result, [])
            state.final_response = '计划校验未通过，已停止执行。'
            return self._result(state, status='validation_failed')

        state.execution_plan = self.executor.run(state)
        state.validation_result = validate_closed_loop(
            state.action_specs,
            state.device_configs,
            state.execution_plan,
        )
        state.observations = build_observations(
            state.action_specs,
            state.execution_plan,
        )
        if not state.validation_result.get('passed'):
            state.validation_errors = state.validation_result.get('errors', [])

        events, final_response = self.result_output.run(state)
        state.result_events = [
            *build_status_events(state.validation_result, state.observations),
            *events,
        ]
        state.final_response = final_response

        return self._result(state)

    def _result(
        self,
        state: AgentState,
        status: str = 'completed',
    ) -> dict[str, Any]:
        return {
            'status': status,
            'success': not state.validation_errors,
            'session_id': state.session_id,
            'schedule_plan': state.schedule_plan,
            'action_specs': state.action_specs,
            'world_state': state.world_state,
            'validation_result': state.validation_result,
            'clarification_result': state.clarification_result,
            'execution_plan': state.execution_plan or {'segments': []},
            'observations': state.observations,
            'result_events': state.result_events,
            'final_response': state.final_response or '',
        }
