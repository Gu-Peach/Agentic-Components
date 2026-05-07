import json
import urllib.error
import urllib.request
from typing import Any

from config import get_settings


class QwenAgentClient:
    def complete_json(
        self,
        *,
        agent_name: str,
        system_prompt: str,
        user_payload: dict[str, Any],
        fallback: dict[str, Any],
    ) -> dict[str, Any]:
        text = self._complete(
            agent_name=agent_name,
            system_prompt=system_prompt,
            user_content=json.dumps(user_payload, ensure_ascii=False),
        )
        if not text:
            return self._with_meta(fallback, agent_name, 'fallback_no_api')

        parsed = self._parse_json(text)
        if parsed is None:
            return self._with_meta(fallback, agent_name, 'fallback_parse_error')
        return self._with_meta(parsed, agent_name, 'qwen')

    def complete_text(
        self,
        *,
        agent_name: str,
        system_prompt: str,
        user_payload: dict[str, Any],
        fallback: str,
    ) -> str:
        text = self._complete(
            agent_name=agent_name,
            system_prompt=system_prompt,
            user_content=json.dumps(user_payload, ensure_ascii=False),
        )
        return text.strip() if text else fallback

    def _complete(
        self,
        *,
        agent_name: str,
        system_prompt: str,
        user_content: str,
    ) -> str | None:
        settings = get_settings()
        api_keys = self._api_keys()
        if not api_keys:
            return None

        body = json.dumps({
            'model': settings.qwen_model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_content},
            ],
            'stream': False,
            'temperature': 0.1,
        }).encode('utf-8')

        for api_key in api_keys:
            content = self._request_completion(
                api_key=api_key,
                agent_name=agent_name,
                api_url=settings.qwen_api_url,
                body=body,
            )
            if content:
                return content
        return None

    def _request_completion(
        self,
        *,
        api_key: str,
        agent_name: str,
        api_url: str,
        body: bytes,
    ) -> str | None:
        request = urllib.request.Request(
            api_url,
            data=body,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
                'X-Agent-Name': agent_name,
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            return None

        choices = payload.get('choices') or []
        if not choices:
            return None
        message = choices[0].get('message') or {}
        content = message.get('content')
        return content if isinstance(content, str) else None

    def _api_keys(self) -> list[str]:
        settings = get_settings()
        keys = [
            *self._parse_keys(settings.dashscope_api_keys),
            *self._parse_keys(settings.dashscope_api_key),
        ]
        unique_keys: list[str] = []
        seen: set[str] = set()
        for key in keys:
            if key in seen:
                continue
            seen.add(key)
            unique_keys.append(key)
        return unique_keys

    def _parse_keys(self, value: str | None) -> list[str]:
        if not value:
            return []

        clean = value.strip()
        if clean.startswith('['):
            try:
                parsed = json.loads(clean)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]

        return [item.strip() for item in clean.split(',') if item.strip()]

    def _parse_json(self, text: str) -> dict[str, Any] | None:
        content = text.strip()
        if content.startswith('```'):
            content = content.strip('`')
            content = content.replace('json\n', '', 1).strip()

        start = content.find('{')
        end = content.rfind('}')
        if start == -1 or end == -1 or end <= start:
            return None

        try:
            parsed = json.loads(content[start:end + 1])
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None

    def _with_meta(
        self,
        payload: dict[str, Any],
        agent_name: str,
        status: str,
    ) -> dict[str, Any]:
        result = dict(payload)
        result['llm'] = {'agent': agent_name, 'provider': 'qwen', 'status': status}
        return result
