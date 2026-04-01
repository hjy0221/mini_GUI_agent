#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { Command } from 'commander';

import {
  printBanner,
  printHeader,
  printInfo,
  printSuccess,
  printError,
  printMuted,
  withSpinner,
  colors,
} from '../utils/terminal';

import { 
  FileReadTool, 
  FileWriteTool, 
  GlobTool, 
  ListDirTool, 
  RunCommandTool, 
  SearchCodeTool,
  EditFileTool,
  ReadMultipleFilesTool
} from '../tools';
import { runAgentLoop } from '../agent/loop';

// ─── Commander 설정 ───────────────────────────────────────────────────────────

const program = new Command();

program
  .name('mini-agent')
  .description('경량화 CLI AI 에이전트 — Claude를 사용한 코드 분석 및 테스트 생성 도구')
  .version('1.2.0');

// ─── test 명령어 (초기 요청 사항 복원) ────────────────────────────────────────

program
  .command('test <directory>')
  .description('지정한 디렉토리의 코드를 분석하고 필요한 테스트를 생성 및 검증합니다.')
  .option('-m, --model <model>', 'Anthropic 모델 이름', 'claude-3-5-sonnet-20241022')
  .option('-i, --max-iterations <number>', '최대 반복 횟수', '15')
  .option('--mock', '실제 API 호출 없이 시뮬레이션 모드로 실행')
  .action(async (directory: string, options: { model: string; maxIterations: string; mock: boolean }) => {
    await runAgentWithGoal(directory, options, '프로젝트 구조를 파악하고, 핵심 로직에 대한 테스트 코드를 작성하거나 기존 테스트를 강화해 주세요.');
  });

// ─── analyze 명령어 ──────────────────────────────────────────────────────────

program
  .command('analyze <directory>')
  .description('지정한 디렉토리를 분석하고 프로젝트 구조를 파악합니다.')
  .option('-m, --model <model>', 'Anthropic 모델 이름', 'claude-3-5-sonnet-20241022')
  .option('-i, --max-iterations <number>', '최대 반복 횟수', '10')
  .option('--mock', '실제 API 호출 없이 시뮬레이션 모드로 실행')
  .action(async (directory: string, options: { model: string; maxIterations: string; mock: boolean }) => {
    await runAgentWithGoal(directory, options, '대상 디렉토리를 분석하고 프로젝트 구조와 주요 로직을 파악해 주세요.');
  });

// ─── generate 명령어 ───────────────────────────────────────────────────────

program
  .command('generate <directory>')
  .description('지정한 디렉토리의 코드를 분석하여 테스트 코드를 자동 생성합니다.')
  .option('-g, --goal <goal>', '상세 작업 목표', '핵심 로직에 대한 유닛 테스트 작성')
  .option('-m, --model <model>', 'Anthropic 모델 이름', 'claude-3-5-sonnet-20241022')
  .option('-i, --max-iterations <number>', '최대 반복 횟수', '15')
  .option('--mock', '실제 API 호출 없이 시뮬레이션 모드로 실행')
  .action(async (directory: string, options: { goal: string; model: string; maxIterations: string; mock: boolean }) => {
    await runAgentWithGoal(directory, options, options.goal);
  });

// ─── 공통 에이전트 실행 로직 ──────────────────────────────────────────────────

async function runAgentWithGoal(directory: string, options: any, goalText: string) {
  printBanner();

  const targetDirectory = path.resolve(directory);
  printHeader('설정 확인');
  printInfo(`대상 디렉토리: ${colors.secondary(targetDirectory)}`);
  printInfo(`모델: ${colors.secondary(options.model)}`);

  if (!fs.existsSync(targetDirectory)) {
    printError(`디렉토리를 찾을 수 없습니다: ${targetDirectory}`);
    process.exit(1);
  }

  // API 키 확인 (Mock 모드가 아닐 때만 필수)
  if (!options.mock && !process.env['ANTHROPIC_API_KEY']) {
    printError('ANTHROPIC_API_KEY 환경 변수가 설정되어 있지 않습니다.');
    process.exit(1);
  }

  // 도구 초기화
  printHeader('도구 초기화');
  const tools = [
    new FileReadTool(),
    new FileWriteTool(),
    new GlobTool(),
    new ListDirTool(),
    new RunCommandTool(),
    new SearchCodeTool(),
    new EditFileTool(),
    new ReadMultipleFilesTool(),
  ];

  tools.forEach(t => printInfo(`${colors.primary(t.name)} 로드됨`));

  // 에이전트 루프 시작
  printHeader('에이전트 작업 시작');
  printMuted(`목표: ${goalText}\n`);

  try {
    const result = await runAgentLoop(tools, {
      targetDirectory,
      model: options.model,
      maxIterations: parseInt(options.maxIterations, 10),
      mock: options.mock,
    }, goalText);

    if (result.success) {
      printSuccess('작업 완료!');
    } else {
      printError('작업 미완료 (최대 반복 횟수 도달)');
    }
  } catch (err) {
    printError(`오류 발생: ${String(err)}`);
    process.exit(1);
  }
}

program.parseAsync(process.argv);
