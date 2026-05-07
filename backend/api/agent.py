import json
from typing import Any, AsyncIterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from agents.closed_loop import (
    get_step_session,
    start_step_session,
    submit_step_observation,
)
from agents.pipeline import AgentPipeline
from schemas.agent import (
    AgentObservationRequest,
    AgentRunRequest,
    AgentRunResponse,
    AgentStepResponse,
)

router = APIRouter(prefix='/api/agent', tags=['agent'])
pipeline = AgentPipeline()


@router.post('/run', response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest) -> AgentRunResponse:
    return AgentRunResponse.model_validate(_run_pipeline(request))


@router.post('/stream')
async def stream_agent(request: AgentRunRequest) -> StreamingResponse:
    result = _run_pipeline(request)
    return StreamingResponse(
        _event_stream(result),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    )


@router.post('/step/start', response_model=AgentStepResponse)
async def start_agent_step(request: AgentRunRequest) -> AgentStepResponse:
    result = _run_pipeline(request)
    return AgentStepResponse.model_validate(start_step_session(result))


@router.get('/step/{session_id}', response_model=AgentStepResponse)
async def get_agent_step(session_id: str) -> AgentStepResponse:
    session = get_step_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail='step session not found')
    return AgentStepResponse.model_validate(session)


@router.post('/step/observe', response_model=AgentStepResponse)
async def observe_agent_step(
    request: AgentObservationRequest,
) -> AgentStepResponse:
    session = submit_step_observation(
        request.session_id,
        request.model_dump(mode='json'),
    )
    if not session:
        raise HTTPException(status_code=404, detail='step session not found')
    return AgentStepResponse.model_validate(session)


async def _event_stream(result: dict[str, Any]) -> AsyncIterator[str]:
    if result.get('status') == 'clarification_required':
        yield _chunk('clarification_required', result['clarification_result'])
        yield _chunk('final_response', {'content': result['final_response']})
        yield 'data: [DONE]\n\n'
        return

    yield _chunk('schedule_plan', result['schedule_plan'])
    yield _chunk('action_specs', {'items': result['action_specs']})
    yield _chunk('world_state', result['world_state'])
    yield _chunk('validation_result', result['validation_result'])
    yield _chunk('execution_plan', result['execution_plan'])
    yield _chunk('step_session', start_step_session(result))
    yield _chunk('observations', {'items': result['observations']})
    for event in result['result_events']:
        yield _chunk(event.get('type', 'simpy_event'), event)
    yield _chunk('final_response', {'content': result['final_response']})
    yield 'data: [DONE]\n\n'


def _chunk(chunk_type: str, data: dict[str, Any]) -> str:
    payload = {'type': chunk_type, 'data': data}
    return f'data: {json.dumps(payload, ensure_ascii=False)}\n\n'


def _run_pipeline(request: AgentRunRequest) -> dict[str, Any]:
    return pipeline.run(
        session_id=request.session_id,
        message=request.message,
        scene_name=request.scene_name,
        scene_skill_path=request.scene_skill_path,
    )
