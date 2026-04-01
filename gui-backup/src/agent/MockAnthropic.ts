import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic SDK를 흉내내는 모킹 클래스입니다.
 * 실제 API 호출 없이 미리 정의된 시나리오대로 응답을 반환합니다.
 */
export class MockAnthropic {
  private scenarioIndex = 0;
  private scenarios = [
    {
      role: 'assistant' as const,
      content: [
        {
          type: 'text',
          text: '안녕하세요! 프로젝트 구조를 분석하겠습니다. 먼저 디렉토리 목록을 확인해 볼게요.'
        },
        {
          type: 'tool_use',
          id: 'tool_1',
          name: 'list_dir',
          input: { directory_path: 'src' }
        }
      ]
    },
    {
      role: 'assistant' as const,
      content: [
        {
          type: 'text',
          text: '디렉토리 구조를 확인했습니다. 핵심 로직인 ToolExecutor를 분석하기 위해 파일을 읽어보겠습니다.'
        },
        {
          type: 'tool_use',
          id: 'tool_2',
          name: 'read_file',
          input: { file_path: 'src/executor/ToolExecutor.ts', limit: 10 }
        }
      ]
    },
    {
      role: 'assistant' as const,
      content: [
        {
          type: 'text',
          text: '모든 분석이 완료되었습니다. 테스트 코드가 잘 작성되어 있으며, 도구 실행 로직도 견고해 보입니다. 이대로 진행하시면 됩니다!'
        }
      ]
    }
  ];

  messages = {
    create: async (params: any): Promise<any> => {
      // 인공적인 지연 시간 추가 (더 현실적인 느낌을 위해)
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = this.scenarios[this.scenarioIndex] || this.scenarios[this.scenarios.length - 1];
      
      // 다음 호출 시 다음 시나리오로 넘어가되, 마지막 시나리오에 머물게 함
      if (this.scenarioIndex < this.scenarios.length - 1) {
        this.scenarioIndex++;
      }

      return {
        id: `mock_msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: response.content,
        stop_reason: response.content.some(c => c.type === 'tool_use') ? 'tool_use' : 'end_turn',
        model: params.model,
      };
    }
  };
}
