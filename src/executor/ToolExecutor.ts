import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ITool, ToolResult, ContentBlock } from '../types';

export class ToolExecutor {
  private registry: Map<string, ITool>;

  constructor(tools: ITool[]) {
    this.registry = new Map(tools.map(tool => [tool.name, tool]));
  }

  /**
   * 도구 이름을 기반으로 도구를 찾아 실행하고, 결과를 ContentBlock 형식으로 반환합니다.
   */
  async execute(toolName: string, input: unknown, toolUseId: string): Promise<ContentBlock> {
    const tool = this.registry.get(toolName);

    if (!tool) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: `Error: 알 수 없는 도구: ${toolName}`,
      };
    }

    try {
      // 1. Zod 스키마를 이용한 입력 검증
      const parsedInput = tool.inputSchema.safeParse(input);
      
      if (!parsedInput.success) {
        const errorDetails = JSON.stringify(parsedInput.error.format());
        return {
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: `Error: 잘못된 도구 입력 형식입니다: ${errorDetails}`,
        };
      }

      // 2. 도구 실행
      const result: ToolResult = await tool.execute(parsedInput.data);

      // 3. 결과 반환
      return {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: result.success ? result.output : `Error: ${result.error}`,
      };

    } catch (err) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: `Error: 도구 실행 중 예기치 못한 오류 발생: ${String(err)}`,
      };
    }
  }

  /**
   * Anthropic API에 전달할 도구 스키마 목록을 생성합니다.
   */
  getAnthropicTools() {
    return Array.from(this.registry.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: this.zodToAnthropicSchema(tool.inputSchema),
    }));
  }

  /**
   * Google Gemini API에 전달할 도구 선언 목록을 생성합니다.
   */
  getGeminiTools() {
    return {
      functionDeclarations: Array.from(this.registry.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: this.zodToGeminiSchema(tool.inputSchema),
      }))
    };
  }

  /**
   * Zod 스키마를 Gemini가 인식할 수 있는 JSON Schema 형식으로 변환합니다.
   */
  private zodToGeminiSchema(schema: z.ZodObject<any>): any {
    const jsonSchema: any = zodToJsonSchema(schema as any);
    
    return {
      type: 'object',
      properties: jsonSchema.properties || {},
      required: jsonSchema.required || [],
    };
  }

  /**
   * Zod 스키마를 Anthropic이 인식할 수 있는 JSON Schema 형식으로 변환합니다.
   */
  private zodToAnthropicSchema(schema: z.ZodObject<any>): any {
    const jsonSchema: any = zodToJsonSchema(schema as any);
    
    // Anthropic은 JSON Schema의 최상위 object를 기대하므로 properties, required 등을 추출하여 반환
    return {
      type: 'object',
      properties: jsonSchema.properties || {},
      required: jsonSchema.required || [],
      // Anthropic은 strict mode 등을 위해 필요 시 추가 속성을 제약할 수 있습니다.
    };
  }
}
