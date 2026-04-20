import type { AgentMessage } from '@/types/agent';

export const runtime = 'edge';

const QWEN_CHAT_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const encoder = new TextEncoder();

type ChatRequest = {
  messages?: AgentMessage[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    return buildSseResponse(
      createLocalStream('请先在 frontend/.env.local 配置 DASHSCOPE_API_KEY。'),
    );
  }

  const qwenResponse = await fetch(QWEN_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.QWEN_MODEL ?? 'qwen-plus',
      messages: toQwenMessages(body.messages ?? []),
      stream: true,
    }),
  });

  if (!qwenResponse.ok || !qwenResponse.body) {
    return buildSseResponse(createLocalStream(await readError(qwenResponse)));
  }

  return buildSseResponse(qwenResponse.body);
}

function toQwenMessages(messages: AgentMessage[]) {
  const chatMessages = messages
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return [
    {
      role: 'system',
      content:
        '你是工业仿真工作区中的 AI 助手。请用简洁中文回答，并优先围绕机器人、焊接单元、属性参数和 simulation 配置给出建议。',
    },
    ...chatMessages.filter((message) => message.role !== 'system'),
  ];
}

function buildSseResponse(body: ReadableStream<Uint8Array>) {
  return new Response(body, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
    },
  });
}

function createLocalStream(message: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(toSseChunk(message)));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

function toSseChunk(content: string) {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content } }],
  })}\n\n`;
}

async function readError(response: Response) {
  const fallback = `通义千问接口返回错误：${response.status}`;

  try {
    const data = (await response.json()) as { message?: string; error?: unknown };
    return data.message ?? JSON.stringify(data.error ?? data) ?? fallback;
  } catch {
    return fallback;
  }
}
