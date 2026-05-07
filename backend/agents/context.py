import json
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from agents.models import AgentContext


FRONTEND_DEMO_ROOT = (
    Path(__file__).resolve().parents[2]
    / 'frontend'
    / 'public'
    / 'demo'
)
BEHAVIOR_DEMO_ROOT = (
    Path(__file__).resolve().parents[2]
    / 'behavior'
    / 'frontend'
    / 'public'
    / 'demo'
)


def load_agent_context(
    scene_name: str,
    scene_skill_path: str | None = None,
) -> AgentContext:
    scene_root = _resolve_scene_root(scene_name, scene_skill_path)
    scene_file = scene_root / 'scene.json'

    if not scene_file.exists():
        raise HTTPException(status_code=404, detail='scene.json not found')

    scene_graph = _read_json(scene_file)
    device_configs = _load_device_configs(scene_root, scene_graph)

    return AgentContext(
        scene_root=str(scene_root),
        scene_graph=scene_graph,
        device_configs=device_configs,
    )


def _resolve_scene_root(scene_name: str, scene_skill_path: str | None) -> Path:
    if scene_skill_path:
        root = Path(scene_skill_path).expanduser().resolve()
    else:
        root = (FRONTEND_DEMO_ROOT / scene_name / 'scene_skills').resolve()
        if not root.exists():
            root = (BEHAVIOR_DEMO_ROOT / scene_name / 'scene_skills').resolve()

    allowed_roots = [FRONTEND_DEMO_ROOT.resolve(), BEHAVIOR_DEMO_ROOT.resolve()]
    if not any(root.is_relative_to(demo_root) for demo_root in allowed_roots):
        raise HTTPException(
            status_code=400,
            detail='scene_skill_path must stay inside demo roots',
        )
    return root


def _load_device_configs(
    scene_root: Path,
    scene_graph: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    configs: dict[str, dict[str, Any]] = {}
    for item in scene_graph.get('devices', []):
        device_id = item.get('id')
        config_file = item.get('configFile')
        if not device_id or not config_file:
            continue

        config_path = (scene_root / config_file).resolve()
        if not config_path.is_relative_to(scene_root.resolve()):
            raise HTTPException(status_code=400, detail='invalid configFile path')
        configs[device_id] = _read_json(config_path)
    return configs


def _read_json(path: Path) -> dict[str, Any]:
    with path.open('r', encoding='utf-8') as file:
        data = json.load(file)
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail=f'invalid json: {path.name}')
    return data
