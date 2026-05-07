from typing import Any

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

        state.schedule_plan = self.scheduler.run(state)
        state.execution_plan = self.executor.run(state)
        events, final_response = self.result_output.run(state)
        state.result_events = events
        state.final_response = final_response

        return {
            'success': not state.validation_errors,
            'session_id': session_id,
            'schedule_plan': state.schedule_plan,
            'execution_plan': state.execution_plan,
            'result_events': state.result_events,
            'final_response': state.final_response or '',
        }
