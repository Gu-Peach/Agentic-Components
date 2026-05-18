from __future__ import annotations

from typing import Any


DIRECTION_ALIASES = {
    'left_to_right': ['从左到右', '左到右', 'left to right'],
    'right_to_left': ['从右到左', '右到左', 'right to left'],
    'front_to_back': ['从前到后', '前到后', 'front to back'],
    'back_to_front': ['从后到前', '后到前', 'back to front'],
}


def normalize_scene_layout(scene_layout: dict[str, Any] | None) -> dict[str, Any]:
    layout = scene_layout.get('layout', {}) if isinstance(scene_layout, dict) else {}
    flow = scene_layout.get('processFlow', {}) if isinstance(scene_layout, dict) else {}
    devices: list[dict[str, Any]] = []
    for item in layout.get('devices', []):
        transform = item.get('transform', {})
        position = transform.get('position', [0, 0, 0])
        devices.append({
            'id': str(item.get('id', '')),
            'name': str(item.get('name', '')),
            'type': str(item.get('type', '')),
            'position': {
                'x': _coord(position, 0),
                'y': _coord(position, 1),
                'z': _coord(position, 2),
            },
        })
    connections = [item for item in flow.get('connections', []) if isinstance(item, dict)]
    return {'devices': [item for item in devices if item['id']], 'connections': connections}


def referenced_devices(text: str, devices: list[dict[str, Any]]) -> list[str]:
    hits: list[tuple[int, str]] = []
    lower = text.lower()
    for device in devices:
        for token in {device['id'].lower(), device['name'].lower()}:
            index = lower.find(token)
            if index >= 0:
                hits.append((index, device['id']))
    ordered: list[str] = []
    seen: set[str] = set()
    for _, device_id in sorted(hits):
        if device_id not in seen:
            seen.add(device_id)
            ordered.append(device_id)
    return ordered


def detect_start_device(text: str, devices: list[dict[str, Any]], existing: list[dict[str, Any]]) -> str | None:
    referenced = referenced_devices(text, devices)
    if referenced:
        return referenced[0]
    if existing:
        return str(existing[0].get('sourceDeviceId') or '') or None
    return None


def detect_end_device(text: str, devices: list[dict[str, Any]], existing: list[dict[str, Any]]) -> str | None:
    referenced = referenced_devices(text, devices)
    if len(referenced) >= 2:
        return referenced[-1]
    if existing:
        return str(existing[-1].get('targetDeviceId') or '') or None
    return None


def detect_direction(text: str) -> str | None:
    lower = text.lower()
    for direction, aliases in DIRECTION_ALIASES.items():
        if any(alias in text or alias in lower for alias in aliases):
            return direction
    return None


def infer_direction(
    devices: list[dict[str, Any]],
    start_device: str | None,
    end_device: str | None,
    existing: list[dict[str, Any]],
) -> str | None:
    axis = primary_axis(devices)
    if not start_device and existing:
        start_device = str(existing[0].get('sourceDeviceId') or '') or None
    if not end_device and existing:
        end_device = str(existing[-1].get('targetDeviceId') or '') or None
    if not start_device or not end_device or start_device == end_device:
        return None
    start = next((item for item in devices if item['id'] == start_device), None)
    end = next((item for item in devices if item['id'] == end_device), None)
    if not start or not end:
        return None
    if axis == 'x':
        return 'left_to_right' if end['position']['x'] >= start['position']['x'] else 'right_to_left'
    return 'front_to_back' if end['position']['z'] >= start['position']['z'] else 'back_to_front'


def primary_axis(devices: list[dict[str, Any]]) -> str:
    spread_x = max(item['position']['x'] for item in devices) - min(item['position']['x'] for item in devices)
    spread_z = max(item['position']['z'] for item in devices) - min(item['position']['z'] for item in devices)
    return 'x' if spread_x >= spread_z else 'z'


def conversation_text(message: str, messages: list[dict[str, Any]] | None) -> str:
    items = [str(item.get('content', '')) for item in messages or []]
    items.append(message)
    return '\n'.join(items)


def _coord(values: Any, index: int) -> float:
    if isinstance(values, list) and len(values) > index:
        return float(values[index])
    return 0.0
