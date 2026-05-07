from typing import Any

from agents.models import AgentState
from agents.qwen import QwenAgentClient


class SchedulingAgent:
    def __init__(self, llm: QwenAgentClient) -> None:
        self.llm = llm

    def run(self, state: AgentState) -> dict[str, Any]:
        actions = self._build_actions(state)
        fallback = {
            'intent': 'run_simulation',
            'scene_name': state.scene_graph.get('name', '未命名场景'),
            'user_message': state.user_message,
            'actions': actions,
            'temporal_constraints': self._constraints(actions),
        }
        plan = self.llm.complete_json(
            agent_name='scheduling_agent',
            system_prompt=(
                '你是工业仿真的调度 Agent。基于 scene.json、设备配置和用户输入，'
                '只输出 JSON，保持 actions 与 temporal_constraints 结构。'
            ),
            user_payload={
                'scene': state.scene_graph,
                'device_types': {
                    key: value.get('type')
                    for key, value in state.device_configs.items()
                },
                'user_message': state.user_message,
                'draft_schedule_plan': fallback,
            },
            fallback=fallback,
        )
        plan['actions'] = self._safe_actions(plan.get('actions'), actions)
        plan['temporal_constraints'] = self._constraints(plan['actions'])
        plan['scene_name'] = fallback['scene_name']
        plan['user_message'] = state.user_message
        return plan

    def _build_actions(self, state: AgentState) -> list[dict[str, Any]]:
        actions: list[dict[str, Any]] = []
        previous_id: str | None = None

        for index, edge in enumerate(state.scene_graph.get('topology', []), 1):
            device_id = self._select_device(edge, state.device_configs)
            if not device_id:
                continue

            action_id = f'a{len(actions) + 1}'
            action = {
                'action_id': action_id,
                'device_id': device_id,
                'action': self._action_name(device_id, edge, state.device_configs),
                'depends_on': [previous_id] if previous_id else [],
                'params': self._params(device_id, edge, state.device_configs),
                'start_policy': self._start_policy(previous_id),
                'source': edge.get('from'),
                'target': edge.get('to'),
            }
            actions.append(action)
            previous_id = action_id

        return actions

    def _select_device(
        self,
        edge: dict[str, Any],
        configs: dict[str, dict[str, Any]],
    ) -> str | None:
        source = edge.get('from')
        target = edge.get('to')
        if source in configs and configs[source].get('type') != 'storage':
            return source
        if target in configs and configs[target].get('type') != 'storage':
            return target
        return None

    def _action_name(
        self,
        device_id: str,
        edge: dict[str, Any],
        configs: dict[str, dict[str, Any]],
    ) -> str:
        device_type = configs.get(device_id, {}).get('type')
        if device_type == 'conveyor':
            return 'transport_to_exit'
        if device_type == 'smart_storage' and edge.get('from') == 'storage':
            return 'retrieve_from_storage'
        target = edge.get('to')
        if (
            device_type == 'smart_storage'
            and target in configs
            and configs[target].get('type') == 'conveyor'
        ):
            return 'deliver_to_next'
        if device_type == 'smart_storage':
            return 'move_to_storage_cell'
        if device_type == 'robot_arm':
            return 'pick_and_place'
        return 'execute'

    def _params(
        self,
        device_id: str,
        edge: dict[str, Any],
        configs: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        if configs.get(device_id, {}).get('type') == 'smart_storage':
            storage_id = 'storage' if 'storage' in configs else edge.get('to')
            return {'targetCellId': 'A1', 'storageId': storage_id}
        return {}

    def _start_policy(self, previous_id: str | None) -> dict[str, Any]:
        if not previous_id:
            return {'type': 'at', 'time': 0}
        return {'type': 'after_action', 'action_id': previous_id, 'offset': 0}

    def _constraints(self, actions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        constraints = []
        for action in actions:
            for dependency in action['depends_on']:
                constraints.append({
                    'from': dependency,
                    'to': action['action_id'],
                    'relation': 'finish_to_start',
                    'offset': 0,
                })
        return constraints

    def _safe_actions(
        self,
        llm_actions: Any,
        fallback_actions: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if not isinstance(llm_actions, list):
            return fallback_actions
        if len(llm_actions) != len(fallback_actions):
            return fallback_actions

        fallback_ids = [item['device_id'] for item in fallback_actions]
        llm_ids = [
            item.get('device_id')
            for item in llm_actions
            if isinstance(item, dict)
        ]
        if llm_ids != fallback_ids:
            return fallback_actions

        return [
            {
                **fallback,
                'params': action.get('params') if isinstance(action, dict) else {},
            }
            for fallback, action in zip(fallback_actions, llm_actions)
        ]
