# Hooks 설정 가이드

이 가이드는 프로젝트에서 hooks 시스템을 설정하고 커스터마이징하는 방법을 설명합니다.

## 빠른 시작 설정

### 1. 의존성 설치

```bash
cd .claude/hooks
npm install
```

### 2. 실행 권한 설정

```bash
chmod +x .claude/hooks/*.sh
```

## 커스터마이징 옵션

### 프로젝트 구조 감지

기본적으로 hooks는 다음 디렉토리 패턴을 감지합니다:

**Frontend:** `frontend/`, `client/`, `web/`, `app/`, `ui/`
**Backend:** `backend/`, `server/`, `api/`, `src/`, `services/`
**Database:** `database/`, `prisma/`, `migrations/`
**Monorepo:** `packages/*`, `examples/*`

### 빌드 명령어 감지

Hooks는 다음을 기반으로 빌드 명령어를 자동 감지합니다:
1. "build" 스크립트가 있는 `package.json`의 존재 여부
2. 패키지 매니저 (pnpm > npm > yarn)
3. 특수 케이스 (Prisma 스키마)

### TypeScript 설정

Hooks는 자동으로 감지합니다:
- 표준 TypeScript 프로젝트용 `tsconfig.json`
- Vite/React 프로젝트용 `tsconfig.app.json`

## 환경 변수

### 전역 환경 변수

쉘 프로필 (`.bashrc`, `.zshrc` 등)에 설정하세요:

```bash
# 에러 처리 리마인더 비활성화
export SKIP_ERROR_REMINDER=1

# 커스텀 프로젝트 디렉토리
export CLAUDE_PROJECT_DIR=/path/to/your/project
```

## Hook 실행 순서

Stop hooks는 `settings.json`에 지정된 순서대로 실행됩니다:

```json
"Stop": [
  {
    "hooks": [
      { "command": "...tsc-check.sh" },           // 첫 번째로 실행
      { "command": "...trigger-build-resolver.sh" } // 두 번째로 실행
    ]
  }
]
```

## 선택적 Hook 활성화

모든 hooks가 필요하지는 않습니다. 프로젝트에 맞는 것을 선택하세요:

### 최소 설정 (Skill 활성화만)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
          }
        ]
      }
    ]
  }
}
```

## 캐시 관리

### 캐시 위치

```
$CLAUDE_PROJECT_DIR/.claude/tsc-cache/[session_id]/
```

### 수동 캐시 정리

```bash
rm -rf $CLAUDE_PROJECT_DIR/.claude/tsc-cache/*
```

## 문제 해결

### Hook이 실행되지 않음

1. `.claude/settings.json`에 hook이 있는지 확인
2. `chmod +x .claude/hooks/*.sh` 실행
3. `$CLAUDE_PROJECT_DIR`이 올바르게 설정되었는지 확인
4. `cd .claude/hooks && npx tsc`를 실행하여 에러 확인

### Hooks 디버깅

어떤 hook에든 디버그 출력 추가:

```bash
# hook 스크립트 상단에
set -x  # 디버그 모드 활성화

# 또는 특정 디버그 라인 추가
echo "DEBUG: file_path=$file_path" >&2
```

## 참고 자료

- [README.md](./README.md) - Hooks 개요
