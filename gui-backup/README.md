# ✦ mini-CLI-agent

> **Claude(Anthropic) 기반의 경량화 AI 엔지니어링 CLI 에이전트**

`mini-CLI-agent`는 로컬 프로젝트의 코드를 분석하고, 유닛 테스트를 생성하며, 명령어를 직접 실행하여 결과를 검증하는 능력을 갖춘 효율적인 AI 에이전트 도구입니다. 복잡한 설정 없이 터미널에서 즉시 강력한 AI 협력을 경험할 수 있습니다.

---

## 🌟 주요 특징

- **단일 루프 에이전트**: 사고 → 도구 선택 → 실행 → 결과 피드백의 견고한 루프 체인을 통해 복잡한 작업을 수행합니다.
- **풍부한 도구 집합(Tooling)**: 파일 읽기/쓰기, 정규표현식 검색, 디렉토리 탐색, 쉘 명령 실행 등 AI가 프로젝트를 이해하기 위한 필수 도구가 내장되어 있습니다.
- **세련된 터미널 UI**: `chalk`와 `ora`를 사용한 직관적이고 미려한 인터페이스를 제공합니다.
- **Mock 모드 지원**: API 키 없이도 에이전트의 워크플로우를 시뮬레이션할 수 있는 데모 모드를 지원합니다.
- **강력한 스키마 검증**: `Zod`와 `zod-to-json-schema`를 사용하여 LLM과의 통신 및 도구 입력값을 엄격히 검증합니다.

---

## 🛠 기술 스택

- **Runtime**: Node.js (TypeScript)
- **AI Backend**: Anthropic Claude API (`claude-3-5-sonnet`)
- **CLI Framework**: Commander.js
- **Validation**: Zod
- **Utilities**: Glob, Chalk, ORA

---

## 🚀 시작하기

### 1. 설치
```bash
git clone <repository-url>
cd mini_CLI_agent
npm install
```

### 2. 환경 설정
Claude API와 통신하기 위해 `ANTHROPIC_API_KEY`를 환경 변수로 설정해야 합니다.
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

---

## 💻 사용법

### 기본 명령어
```bash
# 도움말 확인
npm run dev -- --help

# 프로젝트 구조 분석 (기본 모델 사용)
npm run dev -- analyze <target_directory>

# 테스트 코드 생성 및 검증
npm run dev -- test <target_directory>

# 상세 목표 지정 및 자동 작업 수행
npm run dev -- generate <target_directory> --goal "특정 함수에 대한 리팩토링 및 테스트 작성"
```

### Mock(시뮬레이션) 모드
API 키가 없더라도 에이전트의 동작 방식을 확인하고 싶다면 `--mock` 플래그를 사용하세요.
```bash
npm run dev -- analyze src --mock
```

---

## 📁 프로젝트 구조

```text
src/
├── agent/            # 에이전트 루프 및 AI 클라이언트 (Mock 포함)
├── cli/              # Commander 기반의 CLI 인터페이스 정의
├── executor/         # 도구 선택 및 스키마 변환 로직
├── tools/            # AI가 사용하는 실제 도구들 (Read, Write, Shell, etc.)
├── utils/            # 터미널 출력 및 파일 상태 추적 유틸리티
└── types/            # 전역 타입 정의
```

---

## 🔧 사용 가능한 도구 (Agent Tools)

에이전트는 작업 중 다음과 같은 도구들을 상황에 맞게 호출합니다:

- `list_dir`: 디렉토리 트리 구조를 파악합니다.
- `read_file`: 특정 파일의 내용을 라인 단위로 읽습니다.
- `write_file`: 파일에 내용을 작성합니다 (Staleness 체크 포함).
- `search_code`: 코드 패턴을 검색합니다.
- `edit_file`: 파일 내 특정 텍스트를 정확하게 치환합니다.
- `run_command`: npm test 등 쉘 명령어를 직접 실행합니다.

---

## ⚠️ 라이선스
이 프로젝트는 교육 및 연구 목적으로 제작되었으며 ISC 라이선스를 따릅니다.
