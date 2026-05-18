'use client';

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { SendHorizontal } from 'lucide-react';
import type { AgentResultEvent, ExecutionPlan } from '@/lib/simulation/types';
import { exportSceneLayout, formatProcessFlowBrief, sceneLayoutConnections } from '@/lib/process/sceneLayout';
import { useAgentStore } from '@/stores/agentStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useSimulationStore } from '@/stores/simulationStore';
import type { ProcessCompositionResult } from '@/types/process';
import type { AgentMessage } from '@/types/agent';
import { ChatHeader, MessageCard } from './ChatParts';
import { PlanReviewCard } from './PlanReviewCard';
import { ProcessClarificationCard } from './ProcessClarificationCard';
import { ProcessReviewCard } from './ProcessReviewCard';
import { formatPlanBrief, isResultEvent, toResultEvent } from './planReviewEvents';
import { streamChat } from './streamChat';

type PendingAgentRun = {
  plan: ExecutionPlan;
  stepSessionId: string | null;
  resultEvents: Array<Omit<AgentResultEvent, 'id'> & { id?: string }>;
};

export function AIChatPanel() {
  const { messages, appendMessage, updateMessage } = useAgentStore();
  const { agentSceneName, devices, interfaceConnections, replaceInterfaceConnections } = useSceneStore();
  const { appendLog, queueResultEvent, setExecutionPlan, setStepSessionId } = useSimulationStore();
  const [input, setInput] = useState('');
  const [pendingRun, setPendingRun] = useState<PendingAgentRun | null>(null);
  const [pendingClarification, setPendingClarification] = useState<ProcessCompositionResult | null>(null);
  const [pendingComposition, setPendingComposition] = useState<ProcessCompositionResult | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pendingRun, pendingClarification, pendingComposition]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || streamingId) return;
    startTransition(() => setInput(''));
    void runAgentStream(prompt);
  }

  async function runAgentStream(prompt: string) {
    const userMessage = createMessage('user', prompt);
    const assistantMessage = createMessage('assistant', '');
    const nextMessages = [...messages, userMessage, assistantMessage];
    const pendingEvents: PendingAgentRun['resultEvents'] = [];
    const streamState: {
      plan: ExecutionPlan | null;
      stepSessionId: string | null;
      clarification: ProcessCompositionResult | null;
      composition: ProcessCompositionResult | null;
    } = {
      plan: null,
      stepSessionId: null,
      clarification: null,
      composition: null,
    };
    let fullText = '';

    appendMessage(userMessage);
    appendMessage(assistantMessage);
    setPendingRun(null);
    setPendingClarification(null);
    setPendingComposition(null);
    setStreamingId(assistantMessage.id);

    try {
      await streamChat({
        messages: nextMessages,
        sceneName: agentSceneName,
        sceneLayout: exportSceneLayout(agentSceneName, devices, interfaceConnections),
        onDelta: (delta) => {
          fullText += delta;
          updateMessage(assistantMessage.id, fullText);
        },
        onAgentEvent: (event) => {
          if (event.type === 'clarification_required') {
            appendLog(`[Agent] clarification_required: ${String(event.data?.stage ?? 'unknown')}`);
            streamState.clarification = event.data as ProcessCompositionResult;
          } else if (event.type === 'execution_plan' && event.data) {
            streamState.plan = event.data as ExecutionPlan;
          } else if (event.type === 'step_session' && event.data?.session_id) {
            streamState.stepSessionId = String(event.data.session_id);
          } else if (event.type === 'process_composition_result' && event.data) {
            streamState.composition = event.data as ProcessCompositionResult;
          } else if (isResultEvent(event)) {
            pendingEvents.push(toResultEvent(event));
          }
        },
      });
      const { composition, clarification, plan, stepSessionId } = streamState;

      if (composition?.status === 'proposal_ready') {
        setPendingComposition(composition);
        appendLog('[Agent] process_proposal_ready');
      } else if (
        clarification?.status === 'clarification_required'
        || composition?.status === 'clarification_required'
      ) {
        setPendingClarification(
          (clarification?.status === 'clarification_required' ? clarification : composition) ?? null,
        );
        appendLog('[Agent] process_clarification_required');
      } else if (plan?.segments.length) {
        setPendingRun({ plan, stepSessionId, resultEvents: pendingEvents });
        appendLog(`[Agent] plan_review_required: ${plan.segments.length} steps`);
      } else if (composition?.status === 'ready' && composition.sceneLayout) {
        replaceInterfaceConnections(sceneLayoutConnections(composition.sceneLayout));
        appendLog('[Agent] process_flow_applied');
      } else if (plan) {
        appendLog('[Agent] no_executable_plan');
      }
    } catch {
      updateMessage(assistantMessage.id, 'Agent SSE is temporarily unavailable.');
    } finally {
      setStreamingId(null);
    }
  }

  function approvePendingRun() {
    if (!pendingRun) return;
    setExecutionPlan(pendingRun.plan);
    if (pendingRun.stepSessionId) setStepSessionId(pendingRun.stepSessionId);
    pendingRun.resultEvents.forEach(queueResultEvent);
    appendLog(`[Agent] user_approved_plan: ${pendingRun.plan.segments.length} steps`);
    setPendingRun(null);
  }

  function revisePendingRun() {
    if (!pendingRun) return;
    setInput(`Revise this simulation plan:\n${formatPlanBrief(pendingRun.plan)}\nRequest: `);
    appendLog('[Agent] user_requested_plan_revision');
    setPendingRun(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function approvePendingComposition() {
    if (!pendingComposition?.sceneLayout) return;
    replaceInterfaceConnections(sceneLayoutConnections(pendingComposition.sceneLayout));
    appendLog('[Agent] user_approved_process_flow');
    setPendingComposition(null);
  }

  function submitClarification(answer: string) {
    setPendingClarification(null);
    void runAgentStream(answer);
  }

  function revisePendingComposition() {
    if (!pendingComposition?.sceneLayout) return;
    setInput(`Revise this process flow:\n${formatProcessFlowBrief(pendingComposition.sceneLayout)}\nRequest: `);
    appendLog('[Agent] user_requested_process_revision');
    setPendingComposition(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <section className='flex h-full flex-col bg-[var(--bg-panel-alt)]'>
      <ChatHeader streaming={Boolean(streamingId)} />
      <div ref={scrollRef} className='flex-1 space-y-2 overflow-auto px-3 py-3'>
        {messages.map((message) => <MessageCard key={message.id} message={message} />)}
        {pendingRun ? (
          <PlanReviewCard
            onApprove={approvePendingRun}
            onCancel={() => setPendingRun(null)}
            onRevise={revisePendingRun}
            plan={pendingRun.plan}
          />
        ) : null}
        {pendingClarification ? (
          <ProcessClarificationCard
            clarification={pendingClarification}
            onCancel={() => setPendingClarification(null)}
            onSubmit={submitClarification}
          />
        ) : null}
        {pendingComposition ? (
          <ProcessReviewCard
            onApprove={approvePendingComposition}
            onCancel={() => setPendingComposition(null)}
            onRevise={revisePendingComposition}
            proposal={pendingComposition}
          />
        ) : null}
      </div>
      <form className='border-t border-[var(--border-soft)] p-3' onSubmit={handleSubmit}>
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
            <SendHorizontal size={14} />
          </button>
        </div>
      </form>
    </section>
  );
}

function createMessage(role: AgentMessage['role'], content: string): AgentMessage {
  return { id: `${role}-${Date.now()}-${crypto.randomUUID()}`, role, content };
}
