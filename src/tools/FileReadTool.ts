import * as fs from 'fs/promises';
import { existsSync, statSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { ITool, ToolResult } from '../types';
import { fileStateService } from '../utils/fileState';

/**
 * FileReadTool: 파일의 내용을 읽어오는 도구입니다.
 * claude-code의 구현을 벤치마킹하여 부분 읽기(offset, limit) 및 상태 추적 기능을 지원합니다.
 */
export class FileReadTool implements ITool {
  name = 'read_file';
  description = '지정한 경로의 파일 내용을 읽어 반환합니다. 파일이 너무 크면 offset과 limit을 사용하여 특정 범위만 읽을 수 있습니다.';

  inputSchema = z.object({
    file_path: z.string().describe('읽을 파일의 절대 경로 또는 상대 경로 (예: "src/main.ts")'),
    offset: z.number().int().nonnegative().optional().describe('읽기 시작할 라인 번호 (1-indexed, 기본값 1)'),
    limit: z.number().int().positive().optional().describe('읽을 라인 수 (제공하지 않으면 끝까지 읽음)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { file_path: filePath, offset = 1, limit } = input;
    const resolvedPath = path.resolve(filePath);

    try {
      // 1. 파일 존재 여부 확인
      if (!existsSync(resolvedPath)) {
        return { 
          success: false, 
          output: '', 
          error: `파일을 찾을 수 없습니다: ${resolvedPath}. 경로가 정확한지 확인해 주세요.` 
        };
      }

      // 2. 파일 타입 확인 (디렉토리 여부)
      const stats = statSync(resolvedPath);
      if (stats.isDirectory()) {
        return { 
          success: false, 
          output: '', 
          error: `지정한 경로가 파일이 아닌 디렉토리입니다: ${resolvedPath}. 디렉토리 목록 조회를 원하시면 list_dir을 사용하세요.` 
        };
      }

      // 3. 파일 내용 전체 읽기
      const content = await fs.readFile(resolvedPath, 'utf-8');
      const lines = content.split('\n');
      const totalLines = lines.length;

      // 4. offset 및 limit 처리 (줄 단위 슬라이싱)
      const startIndex = Math.max(0, offset - 1);
      const endIndex = limit ? startIndex + limit : totalLines;
      const slicedLines = lines.slice(startIndex, endIndex);
      const resultText = slicedLines.join('\n');

      // 5. 파일 상태 서비스 업데이트 (Staleness check를 위해 mtime과 전체 내용 저장)
      fileStateService.updateState(resolvedPath, {
        mtime: Math.floor(stats.mtimeMs),
        content: content
      });

      // 6. 결과 출력 구성
      let output = resultText;
      if (limit && totalLines > limit) {
        output += `\n\n[알림] 전체 ${totalLines}줄 중 ${startIndex + 1}~${Math.min(endIndex, totalLines)}줄만 표시되었습니다.`;
      }

      return { success: true, output };
    } catch (err) {
      return { 
        success: false, 
        output: '', 
        error: `파일을 읽는 도중 오류가 발생했습니다: ${String(err)}` 
      };
    }
  }
}
