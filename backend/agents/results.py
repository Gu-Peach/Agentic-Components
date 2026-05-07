from typing import Any

from agents.models import AgentState
from agents.qwen import QwenAgentClient


class ResultOutputAgent:
    def __init__(self, llm: QwenAgentClient) -> None:
        self.llm = llm

    def run(self, state: AgentState) -> tuple[list[dict[str, Any]], str]:
        if not state.execution_plan:
            return [], '未生成可执行计划。'

        events: list[dict[str, Any]] = []
        for segment in state.execution_plan.get('segments', []):
            events.extend(self._events_for_segment(segment))

        total_duration = self._total_duration(state.execution_plan)
        events.append({
            'type': 'summary',
            'time': total_duration,
            'source': 'result_output_agent',
            'event': 'simulation_finished',
            'text': f'[Result] 仿真计划生成完成，总计划时长 {total_duration:.2f}s',
        })

        response = (
            f'已生成 {len(state.execution_plan.get("segments", []))} 个执行段，'
            f'计划总时长约 {total_duration:.2f}s。'
        )
        qwen_response = self.llm.complete_text(
            agent_name='result_output_agent',
            system_prompt=(
                '你是工业仿真的结果输出 Agent。请用简洁中文总结仿真计划，'
                '只能描述 execution_plan 中已有的设备、时间和事件。'
                '禁止声称碰撞已验证、硬件已配置、物理引擎已就绪或真实执行已完成。'
            ),
            user_payload={
                'execution_plan': state.execution_plan,
                'events_preview': events[:6],
                'fallback_response': response,
            },
            fallback=response,
        )
        return events, self._safe_response(qwen_response, response)

    def _events_for_segment(self, segment: dict[str, Any]) -> list[dict[str, Any]]:
        start = float(segment.get('planned_start', 0))
        end = float(segment.get('planned_end', start))
        device_id = segment.get('device_id', 'unknown')
        name = segment.get('segment_name', 'execute')
        return [
            {
                'type': 'simpy_event',
                'time': start,
                'source': device_id,
                'event': 'started',
                'text': f'[{start:6.2f}s] {device_id} 开始 {name}',
            },
            {
                'type': 'simpy_event',
                'time': end,
                'source': device_id,
                'event': 'completed',
                'text': f'[{end:6.2f}s] {device_id} 完成 {name}',
            },
        ]

    def _total_duration(self, execution_plan: dict[str, Any]) -> float:
        ends = [
            float(segment.get('planned_end', 0))
            for segment in execution_plan.get('segments', [])
        ]
        return max(ends, default=0.0)

    def _safe_response(self, response: str, fallback: str) -> str:
        unsafe_terms = ['碰撞', '硬件', '物理引擎', '已验证', '已配置就绪']
        if any(term in response for term in unsafe_terms):
            return fallback
        return response
