'use client';

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { Bot, SendHorizonal, Sparkles, UserRound } from 'lucide-react';
import type { AgentMessage } from '@/types/agent';
import { useAgentStore } from '@/stores/agentStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { streamChat } from './streamChat';
import { useTypewriter } from './useTypewriter';

export function AIChatPanel() {
  const { messages, appendMessage, updateMessage } = useAgentStore();
  const { agentSceneName } = useSceneStore();
  const { queueResultEvent, setExecutionPlan, setStepSessionId } =
    useSimulationStore();
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();

    if (!prompt || streamingId) {
      return;
    }

    startTransition(() => setInput(''));
    void runDemoStream(prompt);
  };

  const runDemoStream = async (prompt: string) => {
    const userMessage = createMessage('user', prompt);
    const assistantMessage = createMessage('assistant', '');
    const nextMessages = [...messages, userMessage, assistantMessage];
    let fullText = '';

    appendMessage(userMessage);
    appendMessage(assistantMessage);
    setStreamingId(assistantMessage.id);

    try {
      await streamChat({
        messages: nextMessages,
        sceneName: agentSceneName,
        onDelta: (delta) => {
          fullText += delta;
          updateMessage(assistantMessage.id, fullText);
        },
        onAgentEvent: (event) => {
          if (event.type === 'execution_plan' && event.data) {
            setExecutionPlan(event.data as Parameters<typeof setExecutionPlan>[0]);
          }
          if (event.type === 'step_session' && event.data?.session_id) {
            setStepSessionId(event.data.session_id);
          }
          if (
            event.type !== 'simpy_event'
            && event.type !== 'summary'
            && event.type !== 'agent_status'
          ) {
            return;
          }
          queueResultEvent({
            type: event.type,
            time: Number(event.data?.time ?? 0),
            source: event.data?.source,
            event: event.data?.event,
            text: event.data?.text ?? event.type,
          });
        },
      });
    } catch {
      updateMessage(assistantMessage.id, 'Agent SSE 暂时不可用，请稍后重试。');
    } finally {
      setStreamingId(null);
    }
  };

  return (
    <section className='flex h-full flex-col bg-[var(--bg-panel-alt)]'>
      <ChatHeader streaming={Boolean(streamingId)} />
      <div ref={scrollRef} className='flex-1 space-y-2 overflow-auto px-3 py-3'>
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            shouldType={message.id === streamingId}
          />
        ))}
      </div>
      <form
        className='border-t border-[var(--border-soft)] p-3'
        onSubmit={handleSubmit}
      >
        <div className='flex items-end gap-2 border border-[var(--border-strong)] bg-[#252525] p-2'>
          <textarea
            className='max-h-28 min-h-16 flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]'
            disabled={Boolean(streamingId)}
            onChange={(event) => setInput(event.target.value)}
            placeholder='输入工艺或仿真要求...'
            value={input}
          />
          <button
            className='flex h-8 w-8 items-center justify-center bg-[var(--bg-accent)] text-white transition hover:bg-[var(--bg-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50'
            disabled={Boolean(streamingId) || isPending || !input.trim()}
            type='submit'
          >
            <SendHorizonal size={14} />
          </button>
        </div>
      </form>
    </section>
  );
}

function ChatHeader({ streaming }: { streaming: boolean }) {
  return (
    <div className='flex h-10 items-center justify-between border-b border-[var(--border-soft)] px-3'>
      <div className='flex items-center gap-2 text-sm text-[var(--text-primary)]'>
        <Sparkles size={14} className='text-[var(--text-accent)]' />
        <span>大模型聊天</span>
      </div>
      <span className='text-[11px] text-[var(--text-muted)]'>
        {streaming ? 'Agent streaming...' : 'Agent SSE'}
      </span>
    </div>
  );
}

function MessageCard({
  message,
  shouldType,
}: {
  message: AgentMessage;
  shouldType: boolean;
}) {
  const typedText = useTypewriter({
    text: message.content,
    batchSize: 1,
    enabled: shouldType,
  });
  const text = shouldType ? typedText : message.content;
  const Icon = message.role === 'user' ? UserRound : Bot;

  return (
    <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.16)] px-3 py-2'>
      <div className='mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)]'>
        <Icon size={11} />
        {message.role}
      </div>
      <p className='whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]'>
        {text}
        {shouldType ? <span className='ml-0.5 animate-pulse'>|</span> : null}
      </p>
    </div>
  );
}

function createMessage(role: AgentMessage['role'], content: string): AgentMessage {
  return {
    id: `${role}-${Date.now()}-${crypto.randomUUID()}`,
    role,
    content,
  };
}
