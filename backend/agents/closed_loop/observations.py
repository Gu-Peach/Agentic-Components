from typing import Any


def build_observations(
    action_specs: list[dict[str, Any]],
    execution_plan: dict[str, Any],
) -> list[dict[str, Any]]:
    specs_by_id = {spec.get('action_id'): spec for spec in action_specs}
    observations = []
    for segment in execution_plan.get('segments', []):
        action_id = segment.get('action_id')
        spec = specs_by_id.get(action_id, {})
        observations.append({
            'type': 'expected_observation',
            'action_id': action_id,
            'segment_id': segment.get('id'),
            'status': 'pending',
            'planned_start': segment.get('planned_start', 0),
            'planned_end': segment.get('planned_end', 0),
            'watch_events': [
                'segment_started',
                'waypoint_reached',
                'segment_completed',
            ],
            'expected_effects': spec.get('expected_effects', []),
        })
    return observations


def build_status_events(
    validation_result: dict[str, Any],
    observations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    status = 'passed' if validation_result.get('passed') else 'failed'
    events = [{
        'type': 'agent_status',
        'time': 0,
        'source': 'closed_loop_validator',
        'event': f'validation_{status}',
        'text': f'[Agent] {validation_result.get("summary", "validation complete")}',
    }]
    events.append({
        'type': 'agent_status',
        'time': 0,
        'source': 'closed_loop_monitor',
        'event': 'observation_plan_ready',
        'text': f'[Agent] 已生成 {len(observations)} 个执行观察点',
    })
    return events
