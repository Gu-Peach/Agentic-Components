from typing import Any

from agents.closed_loop import (
    build_action_specs,
    build_observations,
    build_world_state,
    validate_closed_loop,
)
from agents.closed_loop.clarifier import detect_missing_requirements
from agents.closed_loop.observations import build_status_events
from agents.composition import ProcessCompositionAgent
from agents.context import load_agent_context
from agents.execution import ExecutionAgent
from agents.models import AgentState
from agents.qwen import QwenAgentClient
from agents.results import ResultOutputAgent
from agents.scheduling import SchedulingAgent


class AgentPipeline:
    def __init__(self) -> None:
        llm = QwenAgentClient()
        self.composer = ProcessCompositionAgent(llm)
        self.scheduler = SchedulingAgent(llm)
        self.executor = ExecutionAgent(llm)
        self.result_output = ResultOutputAgent(llm)

    def run(
        self,
        *,
        session_id: str,
        message: str,
        messages: list[dict[str, Any]] | None,
        scene_name: str,
        scene_skill_path: str | None,
        scene_layout: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if _should_run_composition(message, messages or [], scene_layout):
            return self._run_composition(
                session_id=session_id,
                message=message,
                messages=messages or [],
                scene_name=scene_name,
                scene_layout=scene_layout,
            )

        context = load_agent_context(scene_name, scene_skill_path)
        state = AgentState(
            session_id=session_id,
            project_id=scene_name,
            user_message=message,
            messages=messages or [],
            scene_skill_path=context.scene_root,
            scene_graph=context.scene_graph,
            device_configs=context.device_configs,
            scene_layout=scene_layout,
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
            'schedule_plan': state.schedule_plan or {},
            'action_specs': state.action_specs,
            'world_state': state.world_state,
            'validation_result': state.validation_result,
            'clarification_result': state.clarification_result,
            'composition_result': state.composition_result,
            'execution_plan': state.execution_plan or {'segments': []},
            'observations': state.observations,
            'result_events': state.result_events,
            'final_response': state.final_response or '',
        }

    def _run_composition(
        self,
        *,
        session_id: str,
        message: str,
        messages: list[dict[str, Any]],
        scene_name: str,
        scene_layout: dict[str, Any] | None,
    ) -> dict[str, Any]:
        state = AgentState(
            session_id=session_id,
            project_id=scene_name,
            user_message=message,
            messages=messages,
            scene_skill_path='',
            scene_graph={},
            device_configs={},
            scene_layout=scene_layout,
        )
        state.composition_result = self.composer.run(state)
        state.final_response = _composition_response_text(state.composition_result)
        state.clarification_result = (
            state.composition_result if state.composition_result.get('status') == 'clarification_required' else {}
        )
        return self._result(state, status=state.composition_result.get('status', 'completed'))


def _should_run_composition(
    message: str,
    messages: list[dict[str, Any]],
    scene_layout: dict[str, Any] | None,
) -> bool:
    if not scene_layout:
        return False
    normalized = message.lower()
    keywords = [
        '编排',
        '工艺流程',
        '流程',
        '自动连接',
        'material flow',
        'process flow',
        'compose process',
        'revise this process flow',
    ]
    if any(keyword in normalized for keyword in keywords):
        return True
    recent = '\n'.join(str(item.get('content', '')).lower() for item in messages[-4:])
    context_keywords = [
        'process proposal',
        'process flow',
        '起始设备',
        '流转方向',
        '请选择物料流转',
        'revise this process flow',
    ]
    answer_keywords = ['开始', '起点', '方向', '左到右', '右到左', '前到后', '后到前', '修改', '调整']
    return any(keyword in recent for keyword in context_keywords) and any(keyword in message for keyword in answer_keywords)


def _composition_response_text(result: dict[str, Any]) -> str:
    status = result.get('status')
    if status == 'clarification_required':
        questions = result.get('questions', [])
        return (
            questions[0].get('question', '需要更多信息才能完成工艺流程编排。')
            if questions else '需要更多信息才能完成工艺流程编排。'
        )
    if status in {'proposal_ready', 'ready'}:
        return str(result.get('summary', '已生成工艺流程编排提案。'))
    warnings = result.get('warnings', [])
    return warnings[0] if warnings else '工艺流程编排失败。'
