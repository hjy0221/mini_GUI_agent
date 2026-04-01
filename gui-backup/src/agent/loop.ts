import Anthropic from '@anthropic-ai/sdk';
import {
  ITool,
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  AgentConfig,
  AgentLoopResult,
} from '../types';
import { ToolExecutor } from '../executor/ToolExecutor';
import { MockAnthropic } from './MockAnthropic';
import { buildSystemPrompt } from '../prompts/systemPrompt';
import {
  colors,
  icons,
  printAssistantMessage,
  printToolUse,
  printToolResult,
  printIterationHeader,
  printSummary,
  printWarning,
  createSpinner,
} from '../utils/terminal';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const MAX_ITERATIONS = 15;

/**
 * 에이전트 루프: 
 * Anthropic API와 통신하며 도구를 실행하고 결과를 피드백하는 단일 루프를 수행합니다.
 */
export async function runAgentLoop(
  tools: ITool[],
  config: AgentConfig,
  userGoal: string
): Promise<AgentLoopResult> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  
  // 1. 클라이언트 초기화 (Mock 모드 지원)
  let client: any;
  const isMock = config.mock || (!apiKey && process.env['NODE_ENV'] === 'test');

  if (isMock) {
    printWarning('Mock 모드로 실행합니다. 실제 API 호출 없이 시뮬레이션을 수행합니다.');
    client = new MockAnthropic();
  } else {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    client = new Anthropic({ apiKey });
  }

  const executor = new ToolExecutor(tools);
  const anthropicTools = executor.getAnthropicTools();

  // 대화 히스토리 초기화
  const messages: Message[] = [
    {
      role: 'user',
      content: userGoal,
    },
  ];

  let iteration = 0;
  let toolCallCount = 0;
  const startTime = Date.now();
  const maxIter = config.maxIterations ?? MAX_ITERATIONS;
  const model = config.model ?? DEFAULT_MODEL;

  while (iteration < maxIter) {
    iteration++;
    printIterationHeader(iteration, maxIter);

    // 1. LLM 호출 시각화 및 실행
    const spinner = createSpinner('Claude 응답 대기 중...');
    spinner.start();

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: buildSystemPrompt(config.targetDirectory),
        tools: anthropicTools as any,
        messages: messages as Anthropic.MessageParam[],
      });
    } catch (err) {
      spinner.fail(colors.error('API 호출 중 오류 발생'));
      throw err;
    }

    spinner.stop();
    spinner.clear();

    // 2. 응답 데이터 추출
    const responseBlocks: ContentBlock[] = response.content.map((block) => {
      if (block.type === 'text') {
        return { type: 'text', text: block.text } as TextBlock;
      } else if (block.type === 'tool_use') {
        return {
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input as any,
        } as ToolUseBlock;
      }
      return { type: 'text', text: '' } as TextBlock;
    });

    // 어시스턴트 메시지 추가
    messages.push({ role: 'assistant', content: responseBlocks });

    // 텍스트 출력
    const textBlocks = responseBlocks.filter((b): b is TextBlock => b.type === 'text');
    textBlocks.forEach(tb => {
      if (tb.text.trim()) printAssistantMessage(tb.text);
    });

    // 3. 종료 조건 확인 (tool_use가 없는 경우)
    const toolUses = responseBlocks.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    
    if (toolUses.length === 0 || response.stop_reason === 'end_turn') {
      printSummary(iteration, toolCallCount, Date.now() - startTime);
      return {
        success: true,
        iterations: iteration,
        finalMessage: textBlocks.map(b => b.text).join('\n'),
      };
    }

    // 4. 도구 실행
    const results: ToolResultBlock[] = [];
    for (const toolUse of toolUses) {
      toolCallCount++;
      
      const inputSummary = JSON.stringify(toolUse.input);
      const detail = inputSummary.length > 60 ? inputSummary.slice(0, 57) + '...' : inputSummary;
      printToolUse(toolUse.name, detail);

      const toolResult = await executor.execute(toolUse.name, toolUse.input, toolUse.id) as ToolResultBlock;
      
      const isError = toolResult.content.startsWith('Error:');
      printToolResult(!isError, toolResult.content);

      results.push(toolResult);
    }

    // 도구 실행 결과를 다음 사용자 메시지로 추가
    messages.push({ role: 'user', content: results });
  }

  // 루프 종료
  printWarning(`최대 반복 횟수(${maxIter})를 초과했습니다.`);
  return {
    success: false,
    iterations: iteration,
    finalMessage: '작업 미완료 (최대 반복 도달)',
  };
}
