from typing import Any

from agents.motion.trajectory import get_keypoint


def build_world_state(
    configs: dict[str, dict[str, Any]],
    action_specs: list[dict[str, Any]],
) -> dict[str, Any]:
    state = {
        'devices': _device_states(configs),
        'objects': _object_states(configs),
        'storage': _storage_states(configs),
        'plan_status': {
            'current_action_index': 0,
            'retry_count': 0,
            'status': 'validated',
        },
    }
    _apply_expected_effects(state, action_specs)
    return state


def _device_states(configs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    return {
        device_id: {
            'type': config.get('type', 'manual'),
            'state': 'idle',
            'rootNodeName': config.get('rootNodeName'),
            'carrierNodeName': config.get('carrierNodeName'),
        }
        for device_id, config in configs.items()
        if config.get('type') != 'workpiece'
    }


def _object_states(configs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    objects: dict[str, Any] = {}
    first_conveyor = _first_device_of_type(configs, 'conveyor')
    initial = get_keypoint(configs[first_conveyor], 'entry') if first_conveyor else None

    for device_id, config in configs.items():
        if config.get('type') == 'workpiece':
            objects[device_id] = {
                'rootNodeName': config.get('rootNodeName'),
                'location': f'{first_conveyor}.entry' if first_conveyor else 'unknown',
                'position': initial,
            }
    return objects


def _storage_states(configs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    storage: dict[str, Any] = {}
    for device_id, config in configs.items():
        if config.get('type') != 'storage':
            continue
        cells = {}
        for cell in (config.get('grid') or {}).get('cells', []):
            cells[cell.get('id')] = 'empty'
        storage[device_id] = cells
    return storage


def _apply_expected_effects(
    state: dict[str, Any],
    action_specs: list[dict[str, Any]],
) -> None:
    for spec in action_specs:
        for effect in spec.get('expected_effects', []):
            if effect.get('type') == 'object_at':
                _set_all_objects_location(state, effect.get('location'))
            elif effect.get('type') == 'cell_occupied':
                _set_cell_state(state, effect.get('cell'), 'occupied')
            elif effect.get('type') == 'cell_empty':
                _set_cell_state(state, effect.get('cell'), 'empty')


def _set_all_objects_location(state: dict[str, Any], location: str | None) -> None:
    if not location:
        return
    for item in state['objects'].values():
        item['predicted_location'] = location


def _set_cell_state(
    state: dict[str, Any],
    cell_ref: str | None,
    value: str,
) -> None:
    if not cell_ref or '.' not in cell_ref:
        return
    storage_id, cell_id = cell_ref.split('.', 1)
    if storage_id in state['storage'] and cell_id in state['storage'][storage_id]:
        state['storage'][storage_id][cell_id] = value


def _first_device_of_type(
    configs: dict[str, dict[str, Any]],
    device_type: str,
) -> str | None:
    for device_id, config in configs.items():
        if config.get('type') == device_type:
            return device_id
    return None
