from typing import Any


def build_action_specs(schedule_plan: dict[str, Any]) -> list[dict[str, Any]]:
    specs = []
    for action in schedule_plan.get('actions', []):
        specs.append({
            'action_id': action['action_id'],
            'device_id': action['device_id'],
            'action_type': action.get('action', 'execute'),
            'params': action.get('params') or {},
            'source': action.get('source'),
            'target': action.get('target'),
            'depends_on': action.get('depends_on') or [],
            'resources': _resources(action),
            'preconditions': _preconditions(action),
            'expected_effects': _effects(action),
            'failure_conditions': _failure_conditions(action),
            'retry_policy': {'max_retries': 1, 'on_fail': 'replan'},
        })
    return specs


def _resources(action: dict[str, Any]) -> list[str]:
    resources = ['workpiece']
    device_id = action.get('device_id')
    target = action.get('target')
    if device_id:
        resources.append(f'device:{device_id}')
    if target and target != 'end':
        resources.append(f'target:{target}')
    return resources


def _preconditions(action: dict[str, Any]) -> list[dict[str, Any]]:
    conditions = [{'type': 'device_idle', 'device': action.get('device_id')}]
    source = action.get('source')
    if source and source != action.get('device_id'):
        conditions.append({
            'type': 'object_available',
            'object': 'workpiece',
            'location': source,
        })
    return conditions


def _effects(action: dict[str, Any]) -> list[dict[str, Any]]:
    action_name = action.get('action')
    target = action.get('target')
    params = action.get('params') or {}

    if action_name == 'transport_to_exit':
        return [{'type': 'object_at', 'object': 'workpiece', 'location': f'{action["device_id"]}.exit'}]
    if action_name == 'move_to_storage_cell':
        cell = f'{params.get("storageId", "storage")}.{params.get("targetCellId", "A1")}'
        return [
            {'type': 'object_at', 'object': 'workpiece', 'location': cell},
            {'type': 'cell_occupied', 'cell': cell},
        ]
    if action_name == 'retrieve_from_storage':
        cell = f'{params.get("storageId", "storage")}.{params.get("targetCellId", "A1")}'
        return [
            {'type': 'cell_empty', 'cell': cell},
            {'type': 'object_at', 'object': 'workpiece', 'location': f'{action["device_id"]}.transfer_board'},
        ]
    if action_name == 'deliver_to_next' and target:
        return [{'type': 'object_at', 'object': 'workpiece', 'location': f'{target}.entry'}]
    if action_name == 'pick_and_place' and target:
        return [{'type': 'object_at', 'object': 'workpiece', 'location': str(target)}]
    return [{'type': 'action_completed', 'action_id': action.get('action_id')}]


def _failure_conditions(action: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {'type': 'timeout', 'seconds': 30},
        {'type': 'device_missing', 'device': action.get('device_id')},
    ]
