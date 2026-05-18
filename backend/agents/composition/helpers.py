from __future__ import annotations

from typing import Any

from agents.composition.parsing import (
    conversation_text,
    detect_direction,
    detect_end_device,
    detect_start_device,
    infer_direction,
    normalize_scene_layout,
    primary_axis,
    referenced_devices,
)

PROCESS_PORT_IN = 'flow_input'
PROCESS_PORT_OUT = 'flow_output'
PROCESS_TYPES = {'conveyor', 'robot', 'lift', 'storage'}


def clarify_or_compose(
    message: str,
    messages: list[dict[str, Any]] | None,
    scene_layout: dict[str, Any] | None,
) -> dict[str, Any]:
    normalized = normalize_scene_layout(scene_layout)
    devices = normalized['devices']
    processable = [item for item in devices if item['type'] in PROCESS_TYPES]
    existing = normalized['connections']
    conversation = conversation_text(message, messages)

    if not processable:
        return failed_result('当前场景中没有可参与工艺流程编排的设备。')
    if len(processable) == 1:
        return proposal_result(
            inject_connections(scene_layout, []),
            [],
            '当前场景只有一个可编排设备，无需建立流程连接。',
            ['仅保留单设备流程。'],
        )

    referenced = referenced_devices(conversation, processable)
    start_device = detect_start_device(conversation, processable, existing)
    end_device = detect_end_device(conversation, processable, existing)
    direction = detect_direction(conversation) or infer_direction(processable, start_device, end_device, existing)

    if not start_device and referenced:
        start_device = referenced[0]
    if not start_device:
        return clarification_result(processable, ask_direction=direction is None)
    if not direction:
        return clarification_result(processable, ask_direction=True, chosen_start=start_device)

    ordered, axis = order_devices(processable, referenced, start_device, end_device, direction)
    if len(ordered) < 2 and len(processable) > 1:
        return clarification_result(processable, ask_direction=False, chosen_start=start_device)

    connections = build_connections(ordered)
    summary = summarize_connections(connections, start_device, direction)
    reasoning = [
        f'起点设备: {start_device}',
        f'流转方向: {direction}',
        f'排序主轴: {axis}',
    ]
    warnings = [] if ordered else ['未生成新的流程连接。']
    return proposal_result(inject_connections(scene_layout, connections), connections, summary, reasoning, warnings)


def inject_connections(scene_layout: dict[str, Any] | None, connections: list[dict[str, Any]]) -> dict[str, Any]:
    result = dict(scene_layout or {})
    process_flow = dict(result.get('processFlow', {}))
    process_flow['connections'] = connections
    result['processFlow'] = process_flow
    return result


def order_devices(
    devices: list[dict[str, Any]],
    referenced: list[str],
    start_device: str,
    end_device: str | None,
    direction: str,
) -> tuple[list[dict[str, Any]], str]:
    axis = primary_axis(devices)
    reverse = direction in {'right_to_left', 'back_to_front'}
    ordered = sorted(devices, key=lambda item: item['position'][axis], reverse=reverse)
    if referenced and len(referenced) >= 2:
        by_id = {item['id']: item for item in devices}
        explicit = [by_id[item] for item in referenced if item in by_id]
        return explicit, axis
    start_index = next((idx for idx, item in enumerate(ordered) if item['id'] == start_device), 0)
    ordered = ordered[start_index:]
    if end_device:
        end_index = next((idx for idx, item in enumerate(ordered) if item['id'] == end_device), len(ordered) - 1)
        ordered = ordered[:end_index + 1]
    return ordered, axis


def build_connections(devices: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{
        'id': f'{source["id"]}:{PROCESS_PORT_OUT}',
        'sourceDeviceId': source['id'],
        'sourceInterface': PROCESS_PORT_OUT,
        'targetDeviceId': target['id'],
        'targetInterface': PROCESS_PORT_IN,
    } for source, target in zip(devices, devices[1:])]


def summarize_connections(connections: list[dict[str, Any]], start_device: str, direction: str) -> str:
    if not connections:
        return '未生成显式流程连接。'
    chain = ' -> '.join([item['sourceDeviceId'] for item in connections] + [connections[-1]['targetDeviceId']])
    return f'已基于起点 {start_device} 和方向 {direction} 生成流程: {chain}'


def clarification_result(
    devices: list[dict[str, Any]],
    ask_direction: bool,
    chosen_start: str | None = None,
) -> dict[str, Any]:
    questions = []
    if not chosen_start:
        questions.append({
            'id': 'start_device',
            'question': '请选择物料流转的起始设备。',
            'options': [{'label': item['name'], 'value': item['id']} for item in devices],
        })
    if ask_direction:
        questions.append({
            'id': 'flow_direction',
            'question': '请选择物料流转方向。',
            'options': [
                {'label': '从左到右', 'value': 'left_to_right'},
                {'label': '从右到左', 'value': 'right_to_left'},
                {'label': '从前到后', 'value': 'front_to_back'},
                {'label': '从后到前', 'value': 'back_to_front'},
            ],
        })
    return {
        'type': 'process_composition_result',
        'status': 'clarification_required',
        'stage': 'pre_planning',
        'summary': '当前信息不足，先补齐起始设备或流转方向后再生成流程。',
        'context': {'startDeviceId': chosen_start or ''},
        'questions': questions,
        'warnings': [],
    }


def proposal_result(
    scene_layout: dict[str, Any],
    connections: list[dict[str, Any]],
    summary: str,
    reasoning: list[str],
    warnings: list[str] | None = None,
) -> dict[str, Any]:
    return {
        'type': 'process_composition_result',
        'status': 'proposal_ready',
        'stage': 'post_planning',
        'summary': summary,
        'reasoningSummary': reasoning,
        'warnings': warnings or [],
        'sceneLayout': scene_layout,
        'connectionsPreview': [f'{item["sourceDeviceId"]} -> {item["targetDeviceId"]}' for item in connections],
    }


def failed_result(message: str) -> dict[str, Any]:
    return {'type': 'process_composition_result', 'status': 'failed', 'warnings': [message]}
