import re
from typing import Any

from agents.models import AgentState


CELL_PATTERN = re.compile(r'(?<![A-Za-z0-9])([A-Za-z]\d+)(?![A-Za-z0-9])')


def detect_missing_requirements(state: AgentState) -> dict[str, Any]:
    message = state.user_message.strip()
    if not message:
        return _required(
            reason='empty_user_message',
            missing_slots=['simulation_goal'],
            questions=[{
                'id': 'q_simulation_goal',
                'text': '请描述要执行的仿真目标，例如运行完整流程或指定搬运目标。',
                'options': ['运行完整流程', '指定目标位置'],
            }],
        )

    storage_question = _detect_storage_cell_question(state, message)
    if storage_question:
        return storage_question

    revision_question = _detect_plan_revision_question(message)
    if revision_question:
        return revision_question

    device_question = _detect_ambiguous_device_question(state, message)
    if device_question:
        return device_question

    return {'required': False, 'status': 'ready'}


def _detect_storage_cell_question(
    state: AgentState,
    message: str,
) -> dict[str, Any] | None:
    cells = _storage_cells(state.device_configs)
    if not cells or _has_cell_id(message, cells):
        return None
    if _looks_like_default_run(message):
        return None
    if not _mentions_storage_target(message):
        return None

    options = ['auto', *cells[:6]]
    return _required(
        reason='missing_target_cell',
        missing_slots=['targetCellId'],
        questions=[{
            'id': 'q_target_cell',
            'text': '需要确认目标仓位：请选择具体仓位，或回复 auto 让我自动选择。',
            'options': options,
        }],
    )


def _detect_plan_revision_question(message: str) -> dict[str, Any] | None:
    normalized = message.lower()
    revision_words = ['revise', '修改计划', '调整计划', '重规划']
    speed_words = ['慢一点', '快一点', 'slower', 'faster']
    has_revision = any(word in normalized for word in revision_words)
    has_speed_change = any(word in normalized for word in speed_words)
    has_number = any(char.isdigit() for char in normalized)
    if not has_revision or not has_speed_change or has_number:
        return None

    return _required(
        reason='missing_revision_parameter',
        missing_slots=['target_step', 'speed_or_duration'],
        questions=[{
            'id': 'q_revision_speed',
            'text': '需要确认修改范围和参数：请说明第几段，以及希望变慢/变快到多少秒或倍率。',
            'options': ['第 1 段放慢 2 秒', '整体速度 0.5x', '保持自动估算'],
        }],
    )


def _detect_ambiguous_device_question(
    state: AgentState,
    message: str,
) -> dict[str, Any] | None:
    robot_ids = _device_ids_by_type(state.device_configs, 'robot_arm')
    if len(robot_ids) < 2:
        return None
    if _looks_like_default_run(message) or any(item in message for item in robot_ids):
        return None
    if '机械臂' not in message or not any(word in message for word in ['用', '指定']):
        return None

    return _required(
        reason='ambiguous_robot_device',
        missing_slots=['device_id'],
        questions=[{
            'id': 'q_robot_device',
            'text': '场景中有多个机械臂，请指定使用哪一个，或回复 auto 由 Agent 自动选择。',
            'options': ['auto', *robot_ids],
        }],
    )


def _required(
    *,
    reason: str,
    missing_slots: list[str],
    questions: list[dict[str, Any]],
) -> dict[str, Any]:
    text = questions[0]['text'] if questions else '请补充缺失条件后再执行。'
    return {
        'required': True,
        'status': 'clarification_required',
        'reason': reason,
        'missing_slots': missing_slots,
        'questions': questions,
        'message': text,
    }


def _storage_cells(configs: dict[str, dict[str, Any]]) -> list[str]:
    for config in configs.values():
        if config.get('type') != 'storage':
            continue
        cells = config.get('grid', {}).get('cells', [])
        return [
            str(cell.get('id')).upper()
            for cell in cells
            if isinstance(cell, dict) and cell.get('id')
        ]
    return []


def _device_ids_by_type(
    configs: dict[str, dict[str, Any]],
    device_type: str,
) -> list[str]:
    return [
        device_id
        for device_id, config in configs.items()
        if config.get('type') == device_type
    ]


def _has_cell_id(message: str, cells: list[str]) -> bool:
    mentioned = {match.group(1).upper() for match in CELL_PATTERN.finditer(message)}
    return any(cell in mentioned for cell in cells)


def _looks_like_default_run(message: str) -> bool:
    default_words = ['运行', '仿真', '演示', '完整流程', 'run simulation']
    return any(word in message.lower() for word in default_words)


def _mentions_storage_target(message: str) -> bool:
    target_words = ['放到仓位', '放入仓位', '送到仓位', '存入仓位', '移动到仓位']
    loose_words = ['放到格位', '送到格子', '存到格子', '目标仓位']
    return any(word in message for word in [*target_words, *loose_words])
