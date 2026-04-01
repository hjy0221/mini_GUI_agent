import { z } from 'zod';

// ─── Tool 관련 타입 ───────────────────────────────────────────────────────────

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface ITool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute(input: any): Promise<ToolResult>;
}

// ─── LLM 메시지 타입 ───────────────────────────────────────────────────────────

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: ToolInput;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

// ─── 에이전트 관련 타입 ────────────────────────────────────────────────────────

export interface AgentConfig {
  targetDirectory: string;
  model: string;
  maxIterations: number;
  mock?: boolean;
}

export interface AgentLoopResult {
  success: boolean;
  iterations: number;
  finalMessage: string;
}
