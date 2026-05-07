import type { AgentMessage } from '@/types/agent';

export type AgentStreamEvent = {
  type: string;
  data?: {
    text?: string;
    content?: string;
    time?: number;
    source?: string;
    event?: string;
    session_id?: string;
    [key: string]: unknown;
  };
};

type StreamChatParams = {
  messages: AgentMessage[];
  sceneName: string;
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
  onAgentEvent?: (event: AgentStreamEvent) => void;
};

export async function streamChat({
  messages,
  sceneName,
  signal,
  onDelta,
  onAgentEvent,
}: StreamChatParams) {
  const latestUserMessage = [...messages].reverse().find(
    (message) => message.role === 'user',
  );

  const response = await fetch('/api/agent/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: latestUserMessage?.content ?? '',
      sceneName,
      sessionId: 'workspace-default',
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('聊天流启动失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseBuffer(buffer, onDelta, onAgentEvent);
  }
}

function parseSseBuffer(
  buffer: string,
  onDelta: (delta: string) => void,
  onAgentEvent?: (event: AgentStreamEvent) => void,
) {
  const lines = buffer.split('\n');
  const pending = lines.pop() ?? '';

  for (const line of lines) {
    if (!line.startsWith('data: ')) {
      continue;
    }

    const data = line.slice(6);

    if (data === '[DONE]') {
      continue;
    }

    try {
      const json = JSON.parse(data) as AgentStreamEvent & {
        choices?: { delta?: { content?: string } }[];
      };
      const delta = json.choices?.[0]?.delta?.content;

      if (delta) {
        onDelta(delta);
      }
      if (json.type) {
        handleAgentEvent(json, onDelta, onAgentEvent);
      }
    } catch {
      // Ignore incomplete demo chunks; the next read may complete them.
    }
  }

  return pending;
}

function handleAgentEvent(
  event: AgentStreamEvent,
  onDelta: (delta: string) => void,
  onAgentEvent?: (event: AgentStreamEvent) => void,
) {
  onAgentEvent?.(event);

  if (event.type === 'final_response') {
    onDelta(event.data?.content ?? '');
  }

  if (event.type === 'error') {
    onDelta(event.data?.text ?? 'Agent stream failed');
  }
}
