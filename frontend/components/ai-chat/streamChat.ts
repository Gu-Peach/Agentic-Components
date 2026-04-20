import type { AgentMessage } from '@/types/agent';

type StreamChatParams = {
  messages: AgentMessage[];
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
};

export async function streamChat({
  messages,
  signal,
  onDelta,
}: StreamChatParams) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
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
    buffer = parseSseBuffer(buffer, onDelta);
  }
}

function parseSseBuffer(buffer: string, onDelta: (delta: string) => void) {
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
      const json = JSON.parse(data) as {
        choices?: { delta?: { content?: string } }[];
      };
      const delta = json.choices?.[0]?.delta?.content;

      if (delta) {
        onDelta(delta);
      }
    } catch {
      // Ignore incomplete demo chunks; the next read may complete them.
    }
  }

  return pending;
}
