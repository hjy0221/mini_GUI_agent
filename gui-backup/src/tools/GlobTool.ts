import { glob } from 'glob';
import * as path from 'path';
import { z } from 'zod';
import { ITool, ToolResult } from '../types';

/**
 * GlobTool: glob 패턴을 사용하여 파일을 검색하는 도구입니다.
 * claude-code의 구현을 참고하여 검색 결과의 상대 경로 반환 및 요약 정보를 포함합니다.
 */
export class GlobTool implements ITool {
  name = 'glob';
  description = '지정한 패턴(예: "src/**/*.ts")에 매칭되는 파일 목록을 검색합니다.';

  inputSchema = z.object({
    pattern: z.string().describe('검색할 glob 패턴 (예: "**/*.js", "tests/*.spec.ts")'),
    path: z.string().optional().describe('검색을 시작할 기준 디렉토리 경로 (기본값: 현재 디렉토리)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { pattern, path: baseDir = process.cwd() } = input;
    const resolvedBase = path.resolve(baseDir);

    try {
      // glob 라이브러리를 사용하여 파일 검색
      // matches는 기본적으로 cwd 기준의 상대 경로로 반환됨
      const matches = await glob(pattern, {
        cwd: resolvedBase,
        nodir: true, // 디렉토리는 제외하고 파일만 검색
        dot: false,  // 숨김 파일은 제외 (필요 시 옵션으로 추가 가능)
      });

      if (matches.length === 0) {
        return { 
          success: true, 
          output: `패턴 '${pattern}'에 매칭되는 파일이 없습니다.` 
        };
      }

      // 결과가 너무 많을 경우를 대비한 간단한 요약 및 목록 반환
      const fileList = matches.join('\n');
      const output = `총 ${matches.length}개의 매칭된 파일을 찾았습니다:\n\n${fileList}`;

      return { 
        success: true, 
        output 
      };
    } catch (err) {
      return { 
        success: false, 
        output: '', 
        error: `Glob 검색 중 오류가 발생했습니다: ${String(err)}` 
      };
    }
  }
}
