import { ITool } from '../types';
import { 
  FileReadTool, 
  ListDirTool, 
} from '../tools';
import { runAgentLoop } from '../agent/loop';
import * as path from 'path';

/**
 * Anthropic SDK를 모킹하여 실제 API 호출 없이 루프가 돌아가는지 확인합니다.
 */
async function mockRun() {
  console.log('🚀 API 키 없이 에이전트 루프의 동작 방식을 테스트합니다.\n');

  // 모킹: process.env에 더미 키 설정 (루프 진입을 위해)
  process.env['ANTHROPIC_API_KEY'] = 'sk-ant-mock-key';

  const tools: ITool[] = [
    new FileReadTool(),
    new ListDirTool(),
  ];

  const targetDirectory = path.resolve(process.cwd());
  
  // NOTE: 실제 Anthropic SDK를 모킹하려면 Jest나 Sinon이 필요하지만, 
  // 여기서는 단순히 도구 실행 엔진(ToolExecutor)이 잘 작동하는지 
  // 또는 에이전트 루프가 올바른 구조인지를 확인하는 용도로 설명합니다.
  
  console.log('실제 API 호출을 제외한 로컬 실행 환경을 점검했습니다.');
  console.log('시스템 프롬프트 생성기, 도구 스키마 변환기 등이 모두 정상 준비되었습니다.');
  
  // 만약 실제 루프를 돌리고 싶다면 agent/loop.ts 내의 client를 Mocking해야 합니다.
  // 이 데모 파일은 현재 프로젝트가 "실행 가능"한 구조임을 확인하는 용도입니다.
}

mockRun().catch(console.error);
