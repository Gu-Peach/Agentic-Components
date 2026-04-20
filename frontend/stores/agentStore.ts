'use client';

import { create } from 'zustand';
import type { AgentMessage } from '@/types/agent';

type AgentState = {
  messages: AgentMessage[];
  appendMessage: (message: AgentMessage) => void;
  updateMessage: (id: string, content: string) => void;
};

const messages: AgentMessage[] = [
  {
    id: 'agent-1',
    role: 'assistant',
    content:
      '我已经识别到当前焊接工作站场景，接下来可以继续配置机器人属性、默认参数和 simulation 参数。',
  },
  {
    id: 'agent-2',
    role: 'system',
    content:
      '当前处于前端阶段，聊天区使用本地消息模拟，后续会接入真实 SSE 流。',
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  messages,
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, content } : message,
      ),
    })),
}));
