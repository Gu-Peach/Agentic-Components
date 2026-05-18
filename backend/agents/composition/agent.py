from __future__ import annotations

from typing import Any

from agents.composition.helpers import (
    clarify_or_compose,
    inject_connections,
    normalize_scene_layout,
)
from agents.models import AgentState
from agents.qwen import QwenAgentClient


class ProcessCompositionAgent:
    def __init__(self, llm: QwenAgentClient) -> None:
        self.llm = llm

    def run(self, state: AgentState) -> dict[str, Any]:
        fallback = clarify_or_compose(
            state.user_message,
            state.messages,
            state.scene_layout,
        )
        payload = {
            'message': state.user_message,
            'messages': state.messages,
            'scene_layout': normalize_scene_layout(state.scene_layout),
            'current_process_flow': state.scene_layout.get('processFlow', {}) if state.scene_layout else {},
            'draft_result': fallback,
        }
        result = self.llm.complete_json(
            agent_name='process_composition_agent',
            system_prompt=self._system_prompt(),
            user_payload=payload,
            fallback=fallback,
        )
        return self._sanitize(result, fallback, state.scene_layout)

    def _sanitize(
        self,
        result: dict[str, Any],
        fallback: dict[str, Any],
        scene_layout: dict[str, Any] | None,
    ) -> dict[str, Any]:
        status = result.get('status')
        if status not in {'clarification_required', 'proposal_ready', 'ready', 'failed'}:
            return fallback

        if status == 'clarification_required' and not result.get('questions'):
            return fallback

        if status in {'proposal_ready', 'ready'}:
            scene = result.get('sceneLayout')
            if not isinstance(scene, dict):
                return fallback
            process_flow = scene.get('processFlow', {})
            connections = process_flow.get('connections', [])
            if not isinstance(connections, list):
                return fallback
            result['sceneLayout'] = inject_connections(scene_layout, connections)
            result.setdefault(
                'connectionsPreview',
                [f'{item.get("sourceDeviceId")} -> {item.get("targetDeviceId")}' for item in connections],
            )

        result['type'] = 'process_composition_result'
        return result

    def _system_prompt(self) -> str:
        return (
            'You are the process composition agent for an industrial digital twin workspace. '
            'Your job is to compose process-flow connections between devices using only flow_input and flow_output. '
            'Read only device id, name, type, and position from the scene layout. '
            'Never use execution-layer interfaces such as entry, exit, top, bottom, or tool point. '
            'If the start device or flow direction is ambiguous, return clarification_required with concise questions. '
            'If the user asks to revise an existing process flow, preserve valid existing intent and update only what the user changed. '
            'If you can compose a flow, return proposal_ready with sceneLayout.processFlow.connections, reasoningSummary, and warnings. '
            'Return JSON only.'
        )
