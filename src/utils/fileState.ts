/**
 * 파일의 마지막 읽기 상태를 추적하는 서비스입니다.
 * FileWriteTool에서 파일이 읽힌 이후 외부에서 수정되었는지 확인(Staleness check)하는 데 사용됩니다.
 */

export interface FileState {
  mtime: number;   // 마지막으로 읽었을 때의 수정 시간 (ms)
  content: string; // 읽었던 내용 (필요 시 내용 비교를 위해 저장)
}

class FileStateService {
  private static instance: FileStateService;
  private states: Map<string, FileState> = new Map();

  private constructor() {}

  public static getInstance(): FileStateService {
    if (!FileStateService.instance) {
      FileStateService.instance = new FileStateService();
    }
    return FileStateService.instance;
  }

  /**
   * 파일 상태를 업데이트합니다.
   * @param filePath 절대 경로
   * @param state 파일 상태
   */
  public updateState(filePath: string, state: FileState): void {
    this.states.set(filePath, state);
  }

  /**
   * 파일 상태를 조회합니다.
   * @param filePath 절대 경로
   */
  public getState(filePath: string): FileState | undefined {
    return this.states.get(filePath);
  }

  /**
   * 기록된 파일 상태를 제거합니다.
   */
  public deleteState(filePath: string): void {
    this.states.delete(filePath);
  }

  /**
   * 모든 파일 상태를 초기화합니다.
   */
  public clear(): void {
    this.states.clear();
  }
}

export const fileStateService = FileStateService.getInstance();
