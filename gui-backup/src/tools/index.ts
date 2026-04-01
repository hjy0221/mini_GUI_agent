import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { glob } from 'glob';
import { ITool, ToolInput, ToolResult } from '../types';

const execAsync = promisify(exec);

import { FileReadTool } from './FileReadTool';
import { FileWriteTool } from './FileWriteTool';
import { GlobTool } from './GlobTool';

export { FileReadTool, FileWriteTool, GlobTool };


// ─── ListDirTool ──────────────────────────────────────────────────────────────

export class ListDirTool implements ITool {
  name = 'list_dir';
  description = '디렉토리 구조를 트리 형식으로 출력합니다.';

  inputSchema = z.object({
    directory_path: z.string().optional().default('.').describe('조회할 디렉토리 경로'),
    depth: z.number().optional().default(2).describe('조회 깊이'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const dirPath = path.resolve(input.directory_path);
    try {
      const tree = this.generateTree(dirPath, input.depth);
      return { success: true, output: tree };
    } catch (err) {
      return { success: false, output: '', error: String(err) };
    }
  }

  private generateTree(dir: string, maxDepth: number, currentDepth = 0): string {
    if (currentDepth > maxDepth) return '';
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let result = '';
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const indent = '  '.repeat(currentDepth);
      result += `${indent}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}\n`;
      if (entry.isDirectory()) {
        result += this.generateTree(path.join(dir, entry.name), maxDepth, currentDepth + 1);
      }
    }
    return result;
  }
}

// ─── RunCommandTool ───────────────────────────────────────────────────────────

export class RunCommandTool implements ITool {
  name = 'run_command';
  description = '쉘 명령을 실행합니다. (예: npm test, npx vitest)';

  inputSchema = z.object({
    command: z.string().describe('실행할 명령어'),
    cwd: z.string().optional().default(process.cwd()).describe('명령을 실행할 작업 디렉토리'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    try {
      const { stdout, stderr } = await execAsync(input.command, { cwd: input.cwd });
      return { success: true, output: stdout || stderr };
    } catch (err: any) {
      return { success: false, output: err.stdout || '', error: err.stderr || err.message };
    }
  }
}

// ─── SearchCodeTool ───────────────────────────────────────────────────────────

export class SearchCodeTool implements ITool {
  name = 'search_code';
  description = '지정한 디렉토리 내의 파일들에서 텍스트 패턴을 검색합니다.';

  inputSchema = z.object({
    query: z.string().describe('검색할 문자열 또는 패턴'),
    directory_path: z.string().optional().default('.').describe('검색할 디렉토리 경로'),
    file_pattern: z.string().optional().default('**/*').describe('검색할 파일 패턴 (예: "**/*.ts")'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { query, directory_path: dirPath, file_pattern: filePattern } = input;
    const resolvedDir = path.resolve(dirPath);
    
    try {
      // glob 라이브러리를 직접 사용하여 파일 목록을 가져옵니다.
      const files = await glob(filePattern, {
        cwd: resolvedDir,
        absolute: true,
        nodir: true,
      });

      let results = '';
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(query)) {
            results += `${path.relative(resolvedDir, file)}:${index + 1}: ${line.trim()}\n`;
          }
        });
      }

      return { success: true, output: results || '검색 결과가 없습니다.' };
    } catch (err) {
      return { success: false, output: '', error: `코드 검색 중 오류 발생: ${String(err)}` };
    }
  }
}

// ─── EditFileTool ─────────────────────────────────────────────────────────────

export class EditFileTool implements ITool {
  name = 'edit_file';
  description = '지정한 파일에서 특정 텍스트를 찾아 새로운 내용으로 바꿉니다. 파일 전체를 다시 쓰는 것보다 안전합니다.';

  inputSchema = z.object({
    file_path: z.string().describe('수정할 파일의 경로'),
    search_string: z.string().describe('바꿀 대상이 되는 정확한 문자열'),
    replace_string: z.string().describe('새로 교체할 문자열'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { file_path: filePath, search_string: search, replace_string: replace } = input;
    const resolvedPath = path.resolve(filePath);

    try {
      if (!fs.existsSync(resolvedPath)) {
        return { success: false, output: '', error: `파일을 찾을 수 없습니다: ${resolvedPath}` };
      }

      const content = fs.readFileSync(resolvedPath, 'utf-8');
      
      if (!content.includes(search)) {
        return { 
          success: false, 
          output: '', 
          error: `대상 문자열을 파일에서 찾을 수 없습니다. 정확한 맞춤법과 공백을 확인하세요.` 
        };
      }

      // 단순 치환 (모든 일치 항목을 바꿈 - 주의 필요시 split/join 사용)
      const newContent = content.split(search).join(replace);
      fs.writeFileSync(resolvedPath, newContent, 'utf-8');

      return { 
        success: true, 
        output: `파일 수정 완료: ${path.basename(filePath)} (항목 치환됨)` 
      };
    } catch (err) {
      return { success: false, output: '', error: String(err) };
    }
  }
}

// ─── ReadMultipleFilesTool ────────────────────────────────────────────────────

export class ReadMultipleFilesTool implements ITool {
  name = 'read_multiple_files';
  description = '여러 파일의 내용을 한 번에 읽어옵니다. 프로젝트 초기 분석에 효율적입니다.';

  inputSchema = z.object({
    file_paths: z.array(z.string()).describe('읽을 파일 경로들의 배열'),
  });

  async execute(input: z.infer<typeof this.inputSchema>): Promise<ToolResult> {
    const { file_paths: paths } = input;
    let results = '';

    for (const filePath of paths) {
      const resolvedPath = path.resolve(filePath);
      try {
        if (!fs.existsSync(resolvedPath)) {
          results += `--- FILE NOT FOUND: ${filePath} ---\n\n`;
          continue;
        }
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        results += `--- FILE: ${filePath} ---\n${content}\n\n`;
      } catch (err) {
        results += `--- ERROR READING: ${filePath} (${String(err)}) ---\n\n`;
      }
    }

    return { success: true, output: results };
  }
}
