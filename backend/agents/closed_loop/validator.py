from typing import Any

from agents.motion.trajectory import get_keypoint


SUPPORTED_ACTIONS = {
    'conveyor': {'transport_to_exit'},
    'robot_arm': {'pick_and_place'},
    'smart_storage': {
        'move_to_storage_cell',
        'retrieve_from_storage',
        'deliver_to_next',
    },
}


def validate_closed_loop(
    action_specs: list[dict[str, Any]],
    configs: dict[str, dict[str, Any]],
    execution_plan: dict[str, Any] | None = None,
) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    seen: set[str] = set()

    for spec in action_specs:
        _validate_action(spec, configs, seen, errors, warnings)
        seen.add(spec.get('action_id', ''))

    if execution_plan:
        _validate_execution(action_specs, execution_plan, errors, warnings)

    return {
        'passed': not errors,
        'errors': errors,
        'warnings': warnings,
        'summary': _summary(errors, warnings),
    }


def _validate_action(
    spec: dict[str, Any],
    configs: dict[str, dict[str, Any]],
    seen: set[str],
    errors: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
) -> None:
    action_id = spec.get('action_id')
    device_id = spec.get('device_id')
    config = configs.get(device_id)
    if not config:
        errors.append(_error('DEVICE_NOT_FOUND', action_id, f'device not found: {device_id}'))
        return

    device_type = config.get('type', 'manual')
    if spec.get('action_type') not in SUPPORTED_ACTIONS.get(device_type, {'execute'}):
        warnings.append(_warn('ACTION_TYPE_UNCHECKED', action_id, 'action type uses fallback validation'))

    for dependency in spec.get('depends_on') or []:
        if dependency not in seen:
            errors.append(_error('DEPENDENCY_NOT_READY', action_id, f'unknown dependency: {dependency}'))

    if device_type == 'conveyor':
        _validate_conveyor(action_id, config, errors)
    elif device_type == 'smart_storage':
        _validate_storage_action(spec, config, configs, errors)
    elif device_type == 'robot_arm':
        _validate_robot(action_id, config, errors, warnings)


def _validate_conveyor(
    action_id: str | None,
    config: dict[str, Any],
    errors: list[dict[str, Any]],
) -> None:
    if not get_keypoint(config, 'entry'):
        errors.append(_error('KEYPOINT_MISSING', action_id, 'conveyor entry keypoint missing'))
    if not get_keypoint(config, 'exit'):
        errors.append(_error('KEYPOINT_MISSING', action_id, 'conveyor exit keypoint missing'))


def _validate_storage_action(
    spec: dict[str, Any],
    config: dict[str, Any],
    configs: dict[str, dict[str, Any]],
    errors: list[dict[str, Any]],
) -> None:
    action_id = spec.get('action_id')
    if not config.get('rootNodeName') or not config.get('carrierNodeName'):
        errors.append(_error('STORAGE_NODE_MISSING', action_id, 'smart_storage root/carrier node missing'))

    action_type = spec.get('action_type')
    if action_type == 'deliver_to_next':
        target = configs.get(spec.get('target'))
        if not target or not get_keypoint(target, 'entry'):
            errors.append(_error('TARGET_ENTRY_MISSING', action_id, 'target entry keypoint missing'))
        return

    params = spec.get('params') or {}
    storage_id = params.get('storageId')
    cell_id = params.get('targetCellId')
    storage = configs.get(storage_id)
    if not storage or storage.get('type') != 'storage':
        errors.append(_error('STORAGE_NOT_FOUND', action_id, f'storage not found: {storage_id}'))
        return
    if not _cell_exists(storage, cell_id):
        errors.append(_error('CELL_NOT_FOUND', action_id, f'cell not found: {cell_id}'))


def _validate_robot(
    action_id: str | None,
    config: dict[str, Any],
    errors: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
) -> None:
    if not config.get('rootNodeName'):
        errors.append(_error('ROBOT_ROOT_MISSING', action_id, 'robot rootNodeName missing'))
    if not config.get('urdf'):
        warnings.append(_warn('ROBOT_URDF_MISSING', action_id, 'robot urdf config missing'))


def _validate_execution(
    action_specs: list[dict[str, Any]],
    execution_plan: dict[str, Any],
    errors: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
) -> None:
    segments = execution_plan.get('segments', [])
    by_action = {segment.get('action_id'): segment for segment in segments}
    for spec in action_specs:
        action_id = spec.get('action_id')
        segment = by_action.get(action_id)
        if not segment:
            errors.append(_error('SEGMENT_MISSING', action_id, 'execution segment missing'))
            continue
        if len(segment.get('waypoints') or []) < 2:
            errors.append(_error('WAYPOINTS_MISSING', action_id, 'segment has fewer than two waypoints'))
        if float(segment.get('planned_end', 0)) < float(segment.get('planned_start', 0)):
            errors.append(_error('TIME_RANGE_INVALID', action_id, 'planned_end before planned_start'))
    if len(segments) != len(action_specs):
        warnings.append(_warn('SEGMENT_COUNT_MISMATCH', None, 'segment count does not match action count'))


def _cell_exists(storage: dict[str, Any], cell_id: str | None) -> bool:
    return any(cell.get('id') == cell_id for cell in (storage.get('grid') or {}).get('cells', []))


def _error(code: str, action_id: str | None, message: str) -> dict[str, Any]:
    return {'code': code, 'action_id': action_id, 'message': message}


def _warn(code: str, action_id: str | None, message: str) -> dict[str, Any]:
    return {'code': code, 'action_id': action_id, 'message': message}


def _summary(
    errors: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
) -> str:
    if errors:
        return f'closed-loop validation failed: {len(errors)} errors'
    if warnings:
        return f'closed-loop validation passed with {len(warnings)} warnings'
    return 'closed-loop validation passed'
