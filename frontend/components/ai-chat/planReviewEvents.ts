import type { AgentResultEvent, ExecutionPlan } from '@/lib/simulation/types';
import type { AgentStreamEvent } from './streamChat';

export function isResultEvent(event: AgentStreamEvent) {
  return ['simpy_event', 'summary', 'agent_status'].includes(event.type);
}

export function toResultEvent(
  event: AgentStreamEvent,
): Omit<AgentResultEvent, 'id'> & { id?: string } {
  return {
    type: event.type,
    time: Number(event.data?.time ?? 0),
    source: typeof event.data?.source === 'string' ? event.data.source : undefined,
    event: typeof event.data?.event === 'string' ? event.data.event : undefined,
    text: typeof event.data?.text === 'string' ? event.data.text : event.type,
  };
}

export function formatPlanBrief(plan: ExecutionPlan) {
  return plan.segments
    .map((segment, index) => {
      const start = segment.planned_start.toFixed(1);
      const end = segment.planned_end.toFixed(1);
      return `${index + 1}. ${segment.device_id} ${segment.algorithm} ${start}-${end}s`;
    })
    .join('\n');
}
