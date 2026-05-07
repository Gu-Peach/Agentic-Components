from typing import Any

from agents.models import AgentState, Position
from agents.motion.selection import resolve_keypoint, robot_pick, robot_place
from agents.motion.trajectory import (
    conveyor_waypoints,
    default_position,
    estimate_duration,
    robot_waypoints,
    smart_storage_waypoints,
    smart_storage_waypoints_between,
)
from agents.qwen import QwenAgentClient


class ExecutionAgent:
    def __init__(self, llm: QwenAgentClient) -> None:
        self.llm = llm

    def run(self, state: AgentState) -> dict[str, Any]:
        if not state.schedule_plan:
            return {'segments': []}

        segments: list[dict[str, Any]] = []
        by_action: dict[str, dict[str, Any]] = {}

        actions = state.schedule_plan.get('actions', [])
        for index, action in enumerate(actions):
            segment = self._segment_for_action(
                action,
                state.device_configs,
                actions,
                index,
                segments[-1] if segments else None,
            )
            planned_start = self._planned_start(action, by_action)
            duration = segment['estimated_duration']
            segment['planned_start'] = planned_start
            segment['planned_end'] = round(planned_start + duration, 3)
            segments.append(segment)
            by_action[action['action_id']] = segment

        execution_plan = {
            'segments': segments,
            'workpiece_node_name': self._workpiece_node_name(state.device_configs),
            'device_configs': state.device_configs,
        }
        notes = self.llm.complete_json(
            agent_name='execution_agent',
            system_prompt=(
                '你是工业仿真的执行 Agent。轨迹点已由确定性算法生成，'
                '请只补充 execution_notes JSON，不要修改 segments。'
            ),
            user_payload={
                'schedule_plan': state.schedule_plan,
                'execution_plan': execution_plan,
            },
            fallback={'execution_notes': []},
        )
        execution_plan['execution_notes'] = notes.get('execution_notes', [])
        execution_plan['llm'] = notes.get('llm')
        return execution_plan

    def _segment_for_action(
        self,
        action: dict[str, Any],
        configs: dict[str, dict[str, Any]],
        actions: list[dict[str, Any]],
        index: int,
        previous_segment: dict[str, Any] | None,
    ) -> dict[str, Any]:
        device_id = action['device_id']
        config = configs[device_id]
        device_type = config.get('type', 'manual')
        waypoints, motion_data = self._waypoints(
            action,
            config,
            configs,
            actions,
            index,
            previous_segment,
        )
        duration = estimate_duration(waypoints, config)

        segment = {
            'id': f'seg_{device_id}_{action["action_id"]}',
            'action_id': action['action_id'],
            'device_id': device_id,
            'device_type': device_type,
            'segment_name': action['action'],
            'algorithm': self._algorithm(device_type),
            'waypoints': waypoints,
            'estimated_duration': duration,
        }
        if motion_data:
            segment['motionData'] = motion_data
        return segment

    def _waypoints(
        self,
        action: dict[str, Any],
        config: dict[str, Any],
        configs: dict[str, dict[str, Any]],
        actions: list[dict[str, Any]],
        index: int,
        previous_segment: dict[str, Any] | None,
    ) -> tuple[list[Position], dict[str, Any] | None]:
        device_type = config.get('type')
        if device_type == 'conveyor':
            return conveyor_waypoints(config), None
        if device_type == 'robot_arm':
            pick = robot_pick(action, configs, previous_segment)
            place = robot_place(action, configs, actions, index, pick)
            lift = float((config.get('trajectoryConfig') or {}).get('liftHeight', 0.3))
            return robot_waypoints(pick, place, lift), None
        if device_type == 'smart_storage':
            return self._smart_storage_waypoints(
                action,
                config,
                configs,
                previous_segment,
            )
        return [default_position(config)], None

    def _smart_storage_waypoints(
        self,
        action: dict[str, Any],
        config: dict[str, Any],
        configs: dict[str, dict[str, Any]],
        previous_segment: dict[str, Any] | None,
    ) -> tuple[list[Position], dict[str, Any] | None]:
        current = self._previous_end(previous_segment) or default_position(config)
        if action.get('action') == 'deliver_to_next':
            target = resolve_keypoint(configs, action.get('target'), 'entry')
            return smart_storage_waypoints_between(config, current, target)

        params = action.get('params') or {}
        storage_id = params.get('storageId')
        storage_config = configs.get(storage_id)
        if not storage_config:
            return [default_position(config)], None
        return smart_storage_waypoints(
            config,
            storage_config,
            params.get('targetCellId', 'A1'),
            current,
        )

    def _previous_end(self, segment: dict[str, Any] | None) -> Position | None:
        waypoints = (segment or {}).get('waypoints') or []
        if not waypoints:
            return None
        return dict(waypoints[-1])

    def _planned_start(
        self,
        action: dict[str, Any],
        by_action: dict[str, dict[str, Any]],
    ) -> float:
        dependencies = action.get('depends_on') or []
        if dependencies:
            return max(by_action[item]['planned_end'] for item in dependencies)
        policy = action.get('start_policy') or {}
        return float(policy.get('time', 0))

    def _algorithm(self, device_type: str) -> str:
        return {
            'conveyor': 'conveyor_linear',
            'robot_arm': 'robot_arm_ik',
            'smart_storage': 'smart_storage_grid',
        }.get(device_type, 'manual')

    def _workpiece_node_name(self, configs: dict[str, dict[str, Any]]) -> str | None:
        for config in configs.values():
            if config.get('type') == 'workpiece':
                return config.get('rootNodeName')
        return None
