'use server';

import { runAgentLoop } from '@/src/agent/loop';
import { 
  FileReadTool, 
  FileWriteTool, 
  GlobTool, 
  ListDirTool, 
  RunCommandTool, 
  SearchCodeTool,
  EditFileTool,
  ReadMultipleFilesTool
} from '@/src/tools';

/**
 * 에이전트를 실행하는 서버 액션입니다.
 */
export async function startAgent(goal: string, useMock: boolean = true) {
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

  const targetDirectory = process.cwd();

  try {
    const result = await runAgentLoop(tools, {
      targetDirectory,
      model: 'claude-3-5-sonnet-20241022',
      maxIterations: 10,
      mock: useMock,
    }, goal);

    return { success: true, result };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
