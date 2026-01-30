# Hooks

Skills 자동 활성화, 파일 추적, 유효성 검사를 가능하게 하는 Claude Code hooks입니다.

---

## Hooks란?

Hooks는 Claude 워크플로우의 특정 시점에 실행되는 스크립트입니다:
- **UserPromptSubmit**: 사용자가 프롬프트를 제출할 때
- **PreToolUse**: 도구가 실행되기 전
- **PostToolUse**: 도구가 완료된 후
- **Stop**: 사용자가 중지를 요청할 때

**핵심 인사이트:** Hooks는 프롬프트를 수정하고, 작업을 차단하고, 상태를 추적할 수 있어 Claude가 단독으로 할 수 없는 기능을 가능하게 합니다.

---

## 파일 구조

```
.claude/hooks/
├── skill-activation-prompt.sh    # Shell wrapper
├── skill-activation-prompt.ts    # TypeScript 메인 로직
├── post-tool-use-tracker.sh      # 파일 변경 추적
├── tsc-check.sh                  # TypeScript 컴파일 검사 (PostToolUse)
├── trigger-build-resolver.sh     # 빌드 에러 해결 agent 트리거 (Stop)
├── error-handling-reminder.sh    # Shell wrapper
├── error-handling-reminder.ts    # 에러 핸들링 셀프체크
├── stop-build-check-enhanced.sh  # 향상된 Stop 빌드 검사
├── package.json                  # TypeScript 의존성
├── tsconfig.json                 # TypeScript 설정
├── CONFIG.md                     # 추가 설정 가이드
└── README.md                     # 이 문서
```

---

## 필수 Hooks (여기서 시작)

### skill-activation-prompt (UserPromptSubmit)

**목적:** 사용자 프롬프트와 파일 컨텍스트를 기반으로 관련 skills를 자동으로 제안

**작동 방식:**
1. stdin으로 hook input JSON 수신
2. `skill-rules.json` 로드
3. 사용자 프롬프트를 각 skill의 트리거 패턴과 매칭
4. 매칭된 skills를 priority별로 그룹화하여 출력

**settings.json에 추가:**
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

---

### post-tool-use-tracker (PostToolUse)

**목적:** 세션 간 컨텍스트를 유지하기 위해 파일 변경 사항 추적

**settings.json에 추가:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 선택적 Hooks

### tsc-check (Stop)

**목적:** 세션 종료 시 TypeScript 컴파일 검사 실행

### trigger-build-resolver (Stop)

**목적:** 컴파일 실패 시 build-error-resolver agent를 자동 실행

### error-handling-reminder (Stop)

**목적:** 세션 종료 시 에러 핸들링 모범 사례 셀프체크 리마인더 표시

### stop-build-check-enhanced (Stop)

**목적:** 세션 종료 시 종합적인 TypeScript 빌드 검사 및 에러 해결 가이드

---

## Hook 조합 권장 사항

### 기본 설정 (모든 프로젝트)
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh"
        }]
      }
    ]
  }
}
```

### TypeScript 프로젝트 설정
```json
{
  "hooks": {
    "UserPromptSubmit": [...],
    "PostToolUse": [...],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/tsc-check.sh"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/trigger-build-resolver.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 설정 방법

### 1. 의존성 설치

```bash
cd .claude/hooks
npm install
```

### 2. 실행 권한 설정

```bash
chmod +x .claude/hooks/*.sh
```

자세한 설정 가이드는 [CONFIG.md](./CONFIG.md)를 참조하세요.
