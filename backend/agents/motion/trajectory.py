import math
from typing import Any

from agents.models import Position


DEFAULT_SPEED = 0.5
ROBOT_LIFT_HEIGHT = 0.3


def get_keypoint(config: dict[str, Any], name: str) -> Position | None:
    for point in config.get('keyPoints', []):
        if point.get('name') == name and isinstance(point.get('origin'), dict):
            return _to_position(point['origin'])
    return None


def default_position(config: dict[str, Any]) -> Position:
    point = get_keypoint(config, 'entry') or get_keypoint(config, 'transfer_board')
    if point:
        return point

    motion = config.get('motion') or {}
    return {
        'x': 0.0,
        'y': float((motion.get('carrierRange') or {}).get('min', 0.0)),
        'z': 0.0,
    }


def path_length(waypoints: list[Position]) -> float:
    total = 0.0
    for index in range(len(waypoints) - 1):
        total += distance(waypoints[index], waypoints[index + 1])
    return total


def distance(start: Position, end: Position) -> float:
    return math.sqrt(
        (end['x'] - start['x']) ** 2
        + (end['y'] - start['y']) ** 2
        + (end['z'] - start['z']) ** 2
    )


def conveyor_waypoints(config: dict[str, Any]) -> list[Position]:
    start = get_keypoint(config, 'entry') or default_position(config)
    end = get_keypoint(config, 'exit') or start
    return [start, end]


def robot_waypoints(
    pick: Position,
    place: Position,
    lift_height: float = ROBOT_LIFT_HEIGHT,
) -> list[Position]:
    return [
        {'x': pick['x'], 'y': pick['y'] + lift_height, 'z': pick['z']},
        pick,
        {'x': place['x'], 'y': place['y'] + lift_height, 'z': place['z']},
        place,
    ]


def smart_storage_waypoints(
    device_config: dict[str, Any],
    storage_config: dict[str, Any],
    target_cell_id: str,
    current_position: Position | None = None,
) -> tuple[list[Position], dict[str, Any]]:
    target = _find_cell_position(storage_config, target_cell_id)
    return smart_storage_waypoints_between(
        device_config,
        current_position or default_position(device_config),
        target,
    )


def smart_storage_waypoints_between(
    device_config: dict[str, Any],
    current: Position,
    target: Position,
) -> tuple[list[Position], dict[str, Any]]:
    motion = device_config.get('motion') or {}
    root_axis = motion.get('rootAxis', 'x')
    carrier_axis = motion.get('carrierAxis', 'y')

    aligned = dict(current)
    aligned[root_axis] = target[root_axis]

    motion_data = {
        'rootOffset': target[root_axis] - current[root_axis],
        'carrierOffset': target[carrier_axis] - current[carrier_axis],
        'rootAxis': root_axis,
        'carrierAxis': carrier_axis,
    }
    return [current, aligned, target], motion_data


def estimate_duration(
    waypoints: list[Position],
    config: dict[str, Any],
    fallback_speed: float = DEFAULT_SPEED,
) -> float:
    speed = float((config.get('trajectoryConfig') or {}).get('speed', fallback_speed))
    return round(path_length(waypoints) / max(speed, 0.01), 3)


def _find_cell_position(config: dict[str, Any], cell_id: str) -> Position:
    grid = config.get('grid') or {}
    for cell in grid.get('cells', []):
        if cell.get('id') == cell_id:
            return _to_position(cell.get('position') or {})
    raise ValueError(f'cell not found: {cell_id}')


def _to_position(value: dict[str, Any]) -> Position:
    return {
        'x': float(value.get('x', 0.0)),
        'y': float(value.get('y', 0.0)),
        'z': float(value.get('z', 0.0)),
    }
