import { 
  ListDirTool, 
  SearchCodeTool,
  FileReadTool
} from '../tools';
import * as path from 'path';

async function testTools() {
  console.log('🔍 도구들이 정상적으로 작동하는지 로컬 테스트를 진행합니다.\n');

  const listDir = new ListDirTool();
  const searchCode = new SearchCodeTool();
  const readFile = new FileReadTool();

  // 1. ListDir 테스트
  console.log('1. list_dir 실행 중...');
  const listResult = await listDir.execute({ directory_path: 'src', depth: 1 });
  console.log(listResult.success ? '✅ list_dir 성공' : '❌ list_dir 실패: ' + listResult.error);

  // 2. SearchCode 테스트
  console.log('\n2. search_code 실행 중 ("ToolExecutor" 검색)...');
  const searchResult = await searchCode.execute({ 
    query: 'ToolExecutor', 
    directory_path: 'src',
    file_pattern: '**/*.ts' 
  });
  console.log(searchResult.success ? '✅ search_code 성공' : '❌ search_code 실패: ' + searchResult.error);
  if (searchResult.success) {
    console.log('결과 미리보기:\n' + searchResult.output.slice(0, 200) + '...');
  }

  // 3. ReadFile 테스트
  console.log('\n3. read_file 실행 중 (src/cli/index.ts)...');
  const readResult = await readFile.execute({ file_path: 'src/cli/index.ts', limit: 5 });
  console.log(readResult.success ? '✅ read_file 성공' : '❌ read_file 실패: ' + readResult.error);
}

testTools().catch(console.error);
