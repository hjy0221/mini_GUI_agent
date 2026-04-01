import chalk from 'chalk';
import ora, { Ora } from 'ora';

// ─── 색상 팔레트 (claude-code 스타일) ─────────────────────────────────────────

export const colors = {
  primary:   (text: string) => chalk.hex('#A78BFA')(text),  // 보라
  secondary: (text: string) => chalk.hex('#60A5FA')(text),  // 파랑
  success:   (text: string) => chalk.hex('#34D399')(text),  // 초록
  warning:   (text: string) => chalk.hex('#FBBF24')(text),  // 노랑
  error:     (text: string) => chalk.hex('#F87171')(text),  // 빨강
  muted:     (text: string) => chalk.hex('#9CA3AF')(text),  // 회색
  bold:      (text: string) => chalk.bold(text),
  dim:       (text: string) => chalk.dim(text),
};

// ─── 아이콘 ────────────────────────────────────────────────────────────────────

export const icons = {
  robot:    '🤖',
  tool:     '🔧',
  file:     '📄',
  folder:   '📁',
  search:   '🔍',
  check:    '✓',
  cross:    '✗',
  arrow:    '→',
  dot:      '•',
  sparkle:  '✦',
};

// ─── 배너 출력 ────────────────────────────────────────────────────────────────

export function printBanner(): void {
  const line = colors.muted('─'.repeat(56));
  console.log('');
  console.log(line);
  console.log(
    `  ${colors.primary('✦ mini-CLI-agent')}  ${colors.muted('v1.0.0')}  ${colors.secondary('Powered by Claude')}`
  );
  console.log(line);
  console.log('');
}

// ─── 섹션 헤더 ───────────────────────────────────────────────────────────────

export function printHeader(title: string): void {
  console.log('');
  console.log(colors.primary(`  ${icons.sparkle} ${title}`));
  console.log(colors.muted('  ' + '─'.repeat(title.length + 4)));
}

// ─── 상태 메시지 출력 ─────────────────────────────────────────────────────────

export function printInfo(message: string): void {
  console.log(`  ${colors.secondary(icons.arrow)} ${message}`);
}

export function printSuccess(message: string): void {
  console.log(`  ${colors.success(icons.check)} ${message}`);
}

export function printError(message: string): void {
  console.error(`  ${colors.error(icons.cross)} ${message}`);
}

export function printWarning(message: string): void {
  console.log(`  ${colors.warning('⚠')} ${message}`);
}

export function printMuted(message: string): void {
  console.log(`  ${colors.muted(message)}`);
}

// ─── 도구 실행 로그 ───────────────────────────────────────────────────────────

export function printToolUse(toolName: string, detail: string): void {
  console.log(
    `  ${colors.muted(icons.tool)} ${colors.bold(toolName)}` +
    `  ${colors.dim(detail)}`
  );
}

export function printToolResult(success: boolean, preview: string): void {
  const icon = success ? colors.success(icons.check) : colors.error(icons.cross);
  const text = colors.dim(preview.length > 80 ? preview.slice(0, 77) + '...' : preview);
  console.log(`      ${icon} ${text}`);
}

// ─── LLM 응답 출력 ───────────────────────────────────────────────────────────

export function printAssistantMessage(text: string): void {
  const prefix = `  ${colors.primary(icons.robot)} `;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (i === 0) {
      console.log(prefix + line);
    } else {
      console.log('    ' + line);
    }
  });
}

// ─── 구분선 ──────────────────────────────────────────────────────────────────

export function printDivider(): void {
  console.log(colors.muted('  ' + '·'.repeat(54)));
}

// ─── 스피너 팩토리 ────────────────────────────────────────────────────────────

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: 'dots',
    color: 'magenta',
    prefixText: '  ',
  });
}

export function withSpinner<T>(
  text: string,
  fn: () => Promise<T>
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();
  return fn()
    .then((result) => {
      spinner.succeed(colors.success(text));
      return result;
    })
    .catch((err) => {
      spinner.fail(colors.error(text));
      throw err;
    });
}

// ─── 이터레이션 헤더 ─────────────────────────────────────────────────────────

export function printIterationHeader(iteration: number, max: number): void {
  console.log('');
  console.log(
    colors.muted(`  ── 반복 ${iteration}/${max} `) +
    colors.dim('─'.repeat(40))
  );
}

// ─── 완료 요약 ───────────────────────────────────────────────────────────────

export function printSummary(
  iterations: number,
  toolCalls: number,
  elapsed: number
): void {
  console.log('');
  console.log(colors.muted('  ' + '─'.repeat(56)));
  console.log(`  ${colors.success('완료')}`);
  console.log(`  ${colors.muted('반복:')}     ${iterations}회`);
  console.log(`  ${colors.muted('툴 호출:')}  ${toolCalls}회`);
  console.log(`  ${colors.muted('소요 시간:')} ${(elapsed / 1000).toFixed(1)}초`);
  console.log(colors.muted('  ' + '─'.repeat(56)));
  console.log('');
}
