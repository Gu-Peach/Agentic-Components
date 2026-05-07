'use client';

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { SendHorizonal } from 'lucide-react';
import type { AgentResultEvent, ExecutionPlan } from '@/lib/simulation/types';
import type { AgentMessage } from '@/types/agent';
import { useAgentStore } from '@/stores/agentStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { ChatHeader, MessageCard } from './ChatParts';
import { PlanReviewCard } from './PlanReviewCard';
import {
  formatPlanBrief,
  isResultEvent,
  toResultEvent,
} from './planReviewEvents';
import { streamChat } from './streamChat';

type PendingAgentRun = {
  plan: ExecutionPlan;
  stepSessionId: string | null;
  resultEvents: Array<Omit<AgentResultEvent, 'id'> & { id?: string }>;
};

export function AIChatPanel() {
  const { messages, appendMessage, updateMessage } = useAgentStore();
  const { agentSceneName } = useSceneStore();
  const { appendLog, queueResultEvent, setExecutionPlan, setStepSessionId } =
    useSimulationStore();
  const [input, setInput] = useState('');
  const [pendingRun, setPendingRun] = useState<PendingAgentRun | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pendingRun]);

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
    const resultEvents: PendingAgentRun['resultEvents'] = [];
    const received: {
      plan: ExecutionPlan | null;
      stepSessionId: string | null;
    } = { plan: null, stepSessionId: null };
    let fullText = '';

    appendMessage(userMessage);
    appendMessage(assistantMessage);
    setPendingRun(null);
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
          if (event.type === 'clarification_required') {
            const reason = String(event.data?.reason ?? 'missing_requirements');
            appendLog(`[Agent] clarification_required: ${reason}`);
            return;
          }
          if (event.type === 'execution_plan' && event.data) {
            received.plan = event.data as unknown as ExecutionPlan;
            return;
          }
          if (event.type === 'step_session' && event.data?.session_id) {
            received.stepSessionId = String(event.data.session_id);
            return;
          }
          if (isResultEvent(event)) {
            resultEvents.push(toResultEvent(event));
          }
        },
      });
      if (received.plan && received.plan.segments.length > 0) {
        setPendingRun({
          plan: received.plan,
          stepSessionId: received.stepSessionId,
          resultEvents,
        });
        appendLog(
          `[Agent] plan_review_required: ${received.plan.segments.length} steps`,
        );
      } else if (received.plan) {
        appendLog('[Agent] no_executable_plan');
      }
    } catch {
      updateMessage(assistantMessage.id, 'Agent SSE is temporarily unavailable.');
    } finally {
      setStreamingId(null);
    }
  };

  const approvePendingRun = () => {
    if (!pendingRun) {
      return;
    }

    setExecutionPlan(pendingRun.plan);
    if (pendingRun.stepSessionId) {
      setStepSessionId(pendingRun.stepSessionId);
    }
    for (const event of pendingRun.resultEvents) {
      queueResultEvent(event);
    }
    appendLog(`[Agent] user_approved_plan: ${pendingRun.plan.segments.length} steps`);
    setPendingRun(null);
  };

  const cancelPendingRun = () => {
    appendLog('[Agent] user_cancelled_plan');
    setPendingRun(null);
  };

  const revisePendingRun = () => {
    if (!pendingRun) {
      return;
    }

    setInput(`Revise this simulation plan:\n${formatPlanBrief(pendingRun.plan)}\nRequest: `);
    appendLog('[Agent] user_requested_plan_revision');
    setPendingRun(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <section className='flex h-full flex-col bg-[var(--bg-panel-alt)]'>
      <ChatHeader streaming={Boolean(streamingId)} />
      <div ref={scrollRef} className='flex-1 space-y-2 overflow-auto px-3 py-3'>
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
        {pendingRun ? (
          <PlanReviewCard
            onApprove={approvePendingRun}
            onCancel={cancelPendingRun}
            onRevise={revisePendingRun}
            plan={pendingRun.plan}
          />
        ) : null}
      </div>
      <form
        className='border-t border-[var(--border-soft)] p-3'
        onSubmit={handleSubmit}
      >
        <div className='flex items-end gap-2 border border-[var(--border-strong)] bg-[#252525] p-2'>
          <textarea
            ref={inputRef}
            className='max-h-28 min-h-16 flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]'
            disabled={Boolean(streamingId)}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Enter a process or simulation request...'
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

function createMessage(role: AgentMessage['role'], content: string): AgentMessage {
  return {
    id: `${role}-${Date.now()}-${crypto.randomUUID()}`,
    role,
    content,
  };
}
