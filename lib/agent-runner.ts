'use server';

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ITool, Message, ContentBlock, TextBlock, ToolUseBlock, ToolResultBlock, AgentLoopResult } from '@/src/types';
import { ToolExecutor } from '@/src/executor/ToolExecutor';
import { MockAnthropic } from '@/src/agent/MockAnthropic';
import { buildSystemPrompt } from '@/src/prompts/systemPrompt';

export interface LogBlock {
  type: 'thought' | 'tool_use' | 'tool_result' | 'summary' | 'error';
  content: string;
  detail?: string;
  success?: boolean;
}

/**
 * 프로젝트 내의 기존 에이전트 루프와 도구 실행 로직을 GUI 환경에 맞춰 재구현합니다.
 * 실시간 상태 업데이트를 위해 로그 배열을 반환합니다.
 */
export async function runGuiAgent(goal: string, isMock: boolean = true, modelType: 'claude' | 'gemini' = 'claude') {
  const logs: LogBlock[] = [];
  
  // 도구 초기화 (기존 ITool 인터페이스 사용)
  const { 
    FileReadTool, FileWriteTool, GlobTool, ListDirTool, RunCommandTool, SearchCodeTool, EditFileTool, ReadMultipleFilesTool 
  } = await import('@/src/tools');

  const tools: ITool[] = [
    new FileReadTool(), new FileWriteTool(), new GlobTool(), new ListDirTool(), 
    new RunCommandTool(), new SearchCodeTool(), new EditFileTool(), new ReadMultipleFilesTool()
  ];

  const executor = new ToolExecutor(tools);
  const targetDirectory = process.cwd();

  if (modelType === 'claude') {
    return runClaudeLoop(goal, isMock, executor, targetDirectory, logs);
  } else {
    return runGeminiLoop(goal, isMock, executor, targetDirectory, logs);
  }
}

async function runClaudeLoop(goal: string, isMock: boolean, executor: ToolExecutor, targetDirectory: string, logs: LogBlock[]) {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  let client: any;

  if (isMock) {
    client = new MockAnthropic();
    logs.push({ type: 'thought', content: 'Mock 모드 가동 중 (Claude)... 시뮬레이션 데이터를 제공합니다.' });
  } else {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 없습니다.');
    client = new Anthropic({ apiKey });
  }

  const anthropicTools = executor.getAnthropicTools();
  const messages: Message[] = [{ role: 'user', content: goal }];
  let iteration = 0;
  const maxIter = 10;

  try {
    while (iteration < maxIter) {
      iteration++;
      
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: buildSystemPrompt(targetDirectory),
        tools: anthropicTools as any,
        messages: messages as any,
      });

      const responseBlocks: ContentBlock[] = response.content.map((block: any) => {
        if (block.type === 'text') return { type: 'text', text: block.text } as TextBlock;
        if (block.type === 'tool_use') return { type: 'tool_use', id: block.id, name: block.name, input: block.input as any } as ToolUseBlock;
        return { type: 'text', text: '' } as TextBlock;
      });

      messages.push({ role: 'assistant', content: responseBlocks });

      responseBlocks.filter(b => b.type === 'text').forEach((tb: any) => {
        if (tb.text.trim()) logs.push({ type: 'thought', content: tb.text });
      });

      const toolUses = responseBlocks.filter((b): b is ToolUseBlock => b.type === 'tool_use');
      if (toolUses.length === 0) break;

      const results: ToolResultBlock[] = [];
      for (const toolUse of toolUses) {
        logs.push({ type: 'tool_use', content: toolUse.name, detail: JSON.stringify(toolUse.input) });
        const toolResult = await executor.execute(toolUse.name, toolUse.input, toolUse.id) as ToolResultBlock;
        logs.push({ type: 'tool_result', content: toolResult.content, success: !toolResult.content.startsWith('Error:') });
        results.push(toolResult);
      }

      messages.push({ role: 'user', content: results });
    }

    logs.push({ type: 'summary', content: '모든 작업을 완료했습니다.' });
    return { success: true, logs };
  } catch (err) {
    logs.push({ type: 'error', content: `Claude 루프 오류: ${String(err)}` });
    return { success: false, logs };
  }
}

async function runGeminiLoop(goal: string, isMock: boolean, executor: ToolExecutor, targetDirectory: string, logs: LogBlock[]) {
  const apiKey = process.env['GEMINI_API_KEY'];
  
  if (isMock) {
    logs.push({ type: 'thought', content: 'Mock 모드 가동 중 (Gemini)... 현재 Gemini Mock은 Claude 데이터를 재활용합니다.' });
    return runClaudeLoop(goal, true, executor, targetDirectory, logs);
  }

  if (!apiKey) throw new Error('GEMINI_API_KEY가 없습니다.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiTools = executor.getGeminiTools();
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro',
    systemInstruction: buildSystemPrompt(targetDirectory),
    tools: [geminiTools] as any
  });

  const chat = model.startChat({
    history: [],
  });

  let iteration = 0;
  const maxIter = 10;
  let currentGoal = goal;

  try {
    while (iteration < maxIter) {
      iteration++;
      
      const result = await chat.sendMessage(currentGoal);
      const response = await result.response;
      const candidate = response.candidates?.[0];
      const parts = candidate?.content.parts || [];

      // 텍스트 응답 처리
      parts.forEach(part => {
        if (part.text) logs.push({ type: 'thought', content: part.text });
      });

      // 도구 호출 처리
      const callParts = parts.filter(p => p.functionCall);
      if (callParts.length === 0) break;

      const functionResponses = [];

      for (const part of callParts) {
        const call = part.functionCall!;
        logs.push({ type: 'tool_use', content: call.name, detail: JSON.stringify(call.args) });
        
        const toolResult = await executor.execute(call.name, call.args, `gemini_call_${iteration}`);
        const content = (toolResult as ToolResultBlock).content;
        
        logs.push({ type: 'tool_result', content: content, success: !content.startsWith('Error:') });
        
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { content }
          }
        });
      }

      // 다음 턴을 위한 입력은 functionResponse들의 배열(Gemini SDK 스타일)
      currentGoal = functionResponses as any;
    }

    logs.push({ type: 'summary', content: 'Gemini와 함께 작업을 완료했습니다.' });
    return { success: true, logs };
  } catch (err) {
    logs.push({ type: 'error', content: `Gemini 루프 오류: ${String(err)}` });
    return { success: false, logs };
  }
}
