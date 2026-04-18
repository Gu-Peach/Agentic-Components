export type AgentRole = 'system' | 'user' | 'assistant';

export type AgentMessage = {
  id: string;
  role: AgentRole;
  content: string;
};
