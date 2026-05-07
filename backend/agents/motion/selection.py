from typing import Any

from agents.models import Position
from agents.motion.trajectory import default_position, get_keypoint


def resolve_keypoint(
    configs: dict[str, dict[str, Any]],
    device_id: str | None,
    keypoint: str,
) -> Position:
    if not device_id or device_id not in configs:
        return zero_position()
    return get_keypoint(configs[device_id], keypoint) or default_position(configs[device_id])


def robot_pick(
    action: dict[str, Any],
    configs: dict[str, dict[str, Any]],
    previous_segment: dict[str, Any] | None,
) -> Position:
    params = action.get('params') or {}
    if isinstance(params.get('pickCoordinate'), dict):
        return to_position(params['pickCoordinate'])

    if previous_segment:
        waypoints = previous_segment.get('waypoints') or []
        if waypoints:
            return dict(waypoints[-1])

    return resolve_keypoint(configs, action.get('source'), 'exit')


def robot_place(
    action: dict[str, Any],
    configs: dict[str, dict[str, Any]],
    actions: list[dict[str, Any]],
    index: int,
    pick: Position,
) -> Position:
    params = action.get('params') or {}
    if isinstance(params.get('placeCoordinate'), dict):
        return to_position(params['placeCoordinate'])

    target = action.get('target')
    if target in configs and configs[target].get('type') == 'robot_arm':
        next_entry = next_non_robot_entry(configs, actions, index)
        return handoff_position(action['device_id'], target, configs, pick, next_entry)

    return resolve_keypoint(configs, target, 'entry')


def next_non_robot_entry(
    configs: dict[str, dict[str, Any]],
    actions: list[dict[str, Any]],
    index: int,
) -> Position | None:
    for next_action in actions[index + 1:]:
        device_id = next_action.get('device_id')
        if device_id in configs and configs[device_id].get('type') != 'robot_arm':
            return resolve_keypoint(configs, device_id, 'entry')
    return None


def handoff_position(
    current_id: str,
    target_id: str,
    configs: dict[str, dict[str, Any]],
    pick: Position,
    next_entry: Position | None,
) -> Position:
    current_base = configured_position(configs.get(current_id))
    target_base = configured_position(configs.get(target_id))
    if current_base and target_base:
        return {
            'x': (current_base['x'] + target_base['x']) / 2,
            'y': max(current_base['y'], target_base['y']) + 0.3,
            'z': (current_base['z'] + target_base['z']) / 2,
        }

    end = next_entry or pick
    return {
        'x': (pick['x'] + end['x']) / 2,
        'y': max(pick['y'], end['y']),
        'z': (pick['z'] + end['z']) / 2,
    }


def configured_position(config: dict[str, Any] | None) -> Position | None:
    if not config:
        return None
    position = config.get('position')
    return to_position(position) if isinstance(position, dict) else None


def to_position(value: dict[str, Any]) -> Position:
    return {
        'x': float(value.get('x', 0.0)),
        'y': float(value.get('y', 0.0)),
        'z': float(value.get('z', 0.0)),
    }


def zero_position() -> Position:
    return {'x': 0.0, 'y': 0.0, 'z': 0.0}
