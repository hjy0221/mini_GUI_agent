import * as fs from 'fs/promises';
import { existsSync, statSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { ITool, ToolResult } from '../types';
import { fileStateService } from '../utils/fileState';

/**
 * FileWriteTool: 파일에 내용을 쓰는 도구입니다.
 * claude-code의 Staleness check 로직을 차용하여 데이터 무결성을 보장합니다.
 */
export class FileWriteTool implements ITool {
  name = 'write_file';
  description = '지정한 경로에 내용을 파일로 씁니다. 파일이 이미 존재할 경우 덮어쓰며, 외부 수정을 감지하면 쓰기를 중단합니다.';

  inputSchema = z.object({
    file_path: z.string().describe('내용을 쓸 파일의 절대 경로 또는 상대 경로 (예: "src/utils.ts")'),
    content: z.string().describe('파일에 작성할 전체 내용'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { file_path: filePath, content } = input;
    const resolvedPath = path.resolve(filePath);
    const dirPath = path.dirname(resolvedPath);

    try {
      // 1. Staleness Check: 파일이 이미 존재하는 경우, 읽었을 때와 현재 상태를 비교
      if (existsSync(resolvedPath)) {
        const currentStats = statSync(resolvedPath);
        const lastKnownState = fileStateService.getState(resolvedPath);

        // 마지막으로 읽은 기록이 없거나, 그 이후에 파일이 수정되었다면 에러 반환
        // (Full Read가 아닌 경우에도 mtime 비교를 통해 안전하게 처리)
        if (!lastKnownState) {
          return {
            success: false,
            output: '',
            error: `파일(${path.basename(resolvedPath)})을(를) 읽은 기록이 없습니다. 안전한 편집을 위해 쓰기 전에 먼저 'read_file'을 통해 최신 내용을 확인해 주세요.`
          };
        }

        const currentMtime = Math.floor(currentStats.mtimeMs);
        if (currentMtime > lastKnownState.mtime) {
          // 단순 mtime 비교만으로는 부정확할 수 있으므로 내용까지 비교 (optional check)
          const currentContent = await fs.readFile(resolvedPath, 'utf-8');
          if (currentContent !== lastKnownState.content) {
            return {
              success: false,
              output: '',
              error: `파일이 읽힌 이후 작업 공간 외부에서 수정되었습니다. 충돌 방지를 위해 쓰기를 중단합니다. 'read_file'로 최신 내용을 다시 읽으신 후 시도해 주세요.`
            };
          }
        }
      }

      // 2. 디렉토리 구성 확인 및 생성
      if (!existsSync(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true });
      }

      // 3. 파일 쓰기 실행
      await fs.writeFile(resolvedPath, content, 'utf-8');

      // 4. 파일 상태 동기화 (쓰기 후의 mtime과 내용을 서비스에 저장)
      const afterStats = statSync(resolvedPath);
      fileStateService.updateState(resolvedPath, {
        mtime: Math.floor(afterStats.mtimeMs),
        content: content
      });

      return {
        success: true,
        output: `파일이 성공적으로 저장되었습니다: ${resolvedPath}`
      };
    } catch (err) {
      return {
        success: false,
        output: '',
        error: `파일 작성 중 오류가 발생했습니다: ${String(err)}`
      };
    }
  }
}
