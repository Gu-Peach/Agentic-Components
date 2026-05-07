from copy import deepcopy
from time import time
from typing import Any
from uuid import uuid4


SESSIONS: dict[str, dict[str, Any]] = {}


def start_step_session(result: dict[str, Any]) -> dict[str, Any]:
    session_id = f'step-{uuid4().hex}'
    segments = result.get('execution_plan', {}).get('segments', [])
    status = 'waiting_observation' if result.get('success') and segments else 'finished'
    route = 'continue' if status == 'waiting_observation' else 'finish'

    if not result.get('success'):
        status = 'failed'
        route = 'failed'

    session = {
        'session_id': session_id,
        'source_session_id': result.get('session_id', 'default'),
        'status': status,
        'route': route,
        'current_index': 0,
        'result': deepcopy(result),
        'observations': deepcopy(result.get('observations', [])),
        'received_observations': [],
        'message': _message(status, route),
        'created_at': time(),
        'updated_at': time(),
    }
    SESSIONS[session_id] = session
    return serialize_session(session)


def get_step_session(session_id: str) -> dict[str, Any] | None:
    session = SESSIONS.get(session_id)
    return serialize_session(session) if session else None


def submit_step_observation(session_id: str, observation: dict[str, Any]) -> dict[str, Any] | None:
    session = SESSIONS.get(session_id)
    if not session:
        return None

    if session['status'] in {'finished', 'failed'}:
        return serialize_session(session)

    normalized = _normalize_observation(observation)
    session['received_observations'].append(normalized)
    error = _validate_observation(session, normalized)

    if error:
        _fail(session, error)
    elif normalized.get('status') == 'failed':
        _fail(session, normalized.get('error') or 'step failed')
    elif normalized.get('status') == 'completed':
        _complete_current_step(session, normalized)
    else:
        session['status'] = 'waiting_observation'
        session['route'] = 'continue'
        session['message'] = 'Observation received; waiting for completion.'

    session['updated_at'] = time()
    return serialize_session(session)


def serialize_session(session: dict[str, Any]) -> dict[str, Any]:
    segments = _segments(session)
    return {
        'success': session['route'] != 'failed',
        'session_id': session['session_id'],
        'source_session_id': session['source_session_id'],
        'status': session['status'],
        'route': session['route'],
        'current_index': session['current_index'],
        'total_steps': len(segments),
        'current_step': _current_step(session),
        'observations': session['observations'],
        'received_observations': session['received_observations'],
        'message': session.get('message', ''),
    }


def _complete_current_step(session: dict[str, Any], observation: dict[str, Any]) -> None:
    current = _current_step(session)
    if current:
        expected = current.get('expected_observation') or {}
        expected['status'] = 'completed'
        expected['actual_sim_time'] = observation.get('sim_time')
        expected['events'] = observation.get('events', [])

    session['current_index'] += 1
    if session['current_index'] >= len(_segments(session)):
        session['status'] = 'finished'
        session['route'] = 'finish'
        session['message'] = 'All steps completed.'
        return

    session['status'] = 'waiting_observation'
    session['route'] = 'continue'
    session['message'] = 'Step completed; continue with next step.'


def _current_step(session: dict[str, Any]) -> dict[str, Any] | None:
    index = session['current_index']
    segments = _segments(session)
    if index >= len(segments) or session['route'] in {'finish', 'failed'}:
        return None

    segment = segments[index]
    action_spec = _action_for_segment(session, segment, index)
    observation = _observation_for_segment(session, segment, index)
    return {
        'index': index,
        'action_spec': action_spec,
        'segment': segment,
        'expected_observation': observation,
        'supervisor_route': {'route': 'execute_step', 'wait_for': 'segment_completed'},
        'world_state': _world_state(session),
    }


def _action_for_segment(session: dict[str, Any], segment: dict[str, Any], index: int) -> dict[str, Any]:
    specs = session['result'].get('action_specs', [])
    action_id = segment.get('action_id')
    for spec in specs:
        if spec.get('action_id') == action_id:
            return spec
    return specs[index] if index < len(specs) else {}


def _observation_for_segment(
    session: dict[str, Any], segment: dict[str, Any], index: int,
) -> dict[str, Any]:
    observations = session['observations']
    segment_id = segment.get('id')
    for observation in observations:
        if observation.get('segment_id') == segment_id:
            return observation
    return observations[index] if index < len(observations) else {}


def _validate_observation(session: dict[str, Any], observation: dict[str, Any]) -> str | None:
    step = _current_step(session)
    if not step:
        return 'no executable current step'

    segment = step['segment']
    if observation.get('segment_id') != segment.get('id'):
        return 'observation segment does not match current step'
    if observation.get('action_id') != segment.get('action_id'):
        return 'observation action does not match current step'
    return None


def _normalize_observation(observation: dict[str, Any]) -> dict[str, Any]:
    return {
        'type': observation.get('type', 'step_observation'),
        'action_id': observation.get('action_id'),
        'segment_id': observation.get('segment_id'),
        'status': observation.get('status', 'completed'),
        'sim_time': float(observation.get('sim_time') or 0),
        'events': observation.get('events') or [],
        'objects': observation.get('objects') or {},
        'error': observation.get('error'),
        'received_at': time(),
    }


def _fail(session: dict[str, Any], reason: str) -> None:
    session['status'] = 'failed'
    session['route'] = 'failed'
    session['message'] = reason


def _segments(session: dict[str, Any]) -> list[dict[str, Any]]:
    return session['result'].get('execution_plan', {}).get('segments', [])


def _world_state(session: dict[str, Any]) -> dict[str, Any]:
    state = deepcopy(session['result'].get('world_state', {}))
    state['plan_status'] = {
        'current_action_index': session['current_index'],
        'status': session['status'],
        'route': session['route'],
    }
    return state


def _message(status: str, route: str) -> str:
    if route == 'failed':
        return 'Plan validation failed; execution stopped.'
    if status == 'finished':
        return 'No executable step is required.'
    return 'Step session ready; execute current segment.'
