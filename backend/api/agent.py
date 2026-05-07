import json
from typing import Any, AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from agents.pipeline import AgentPipeline
from schemas.agent import AgentRunRequest, AgentRunResponse

router = APIRouter(prefix='/api/agent', tags=['agent'])
pipeline = AgentPipeline()


@router.post('/run', response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest) -> AgentRunResponse:
    result = pipeline.run(
        session_id=request.session_id,
        message=request.message,
        scene_name=request.scene_name,
        scene_skill_path=request.scene_skill_path,
    )
    return AgentRunResponse.model_validate(result)


@router.post('/stream')
async def stream_agent(request: AgentRunRequest) -> StreamingResponse:
    result = pipeline.run(
        session_id=request.session_id,
        message=request.message,
        scene_name=request.scene_name,
        scene_skill_path=request.scene_skill_path,
    )
    return StreamingResponse(
        _event_stream(result),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    )


async def _event_stream(result: dict[str, Any]) -> AsyncIterator[str]:
    yield _chunk('schedule_plan', result['schedule_plan'])
    yield _chunk('execution_plan', result['execution_plan'])
    for event in result['result_events']:
        yield _chunk(event.get('type', 'simpy_event'), event)
    yield _chunk('final_response', {'content': result['final_response']})
    yield 'data: [DONE]\n\n'


def _chunk(chunk_type: str, data: dict[str, Any]) -> str:
    payload = {'type': chunk_type, 'data': data}
    return f'data: {json.dumps(payload, ensure_ascii=False)}\n\n'
