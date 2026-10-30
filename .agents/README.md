# 🍁 OpenMaple Loop Engineering & Agent-Native Architecture

## 1. Loop Engineering Overview (루프 엔지니어링 & 에이전트 네이티브 개요)
OpenMaple은 2000년대 빅뱅 이전 넥슨 클래식 메이플스토리 엔진의 정밀한 물리, 그래픽, 전투 타격감, UI/UX를 100% 웹 바닐라 환경에서 재현하는 프로젝트입니다.

본 프로젝트는 **사람이 코드를 한 줄씩 수동 리뷰하는 방식을 배제(Human-Out-of-the-Loop)**하고, 컨트리뷰터가 자유롭게 LLM 에이전트를 활용하여 기여하되 레포지토리의 자동화 QA 에이전트와 교차 검증을 거치는 **Agent-Native 폐쇄 루프(Closed-Loop)**로 운영됩니다.

```
                    ┌───────────────────────────────┐
                    │     1. Quality Planner        │
                    │  (품질 계획 & 고증 수용 기준)   │
                    └───────────────┬───────────────┘
                                    │ Spec & Traceability Matrix
                                    ▼
                    ┌───────────────────────────────┐
                    │     2. Core Developer         │
                    │  (엔진, 영속성, 그래픽, 물리)   │
                    └───────────────┬───────────────┘
                                    │ Executable Artifacts
                                    ▼
                    ┌───────────────────────────────┐
                    │     3. Test QA Engineer       │
                    │  (CDP 헤드리스 브라우저 QA)    │
                    └───────────────┬───────────────┘
                                    │ Pass/Fail Logs & Machine Evidence
                                    ▼
                    ┌───────────────────────────────┐
                    │     4. Quality Controller     │
                    │  (무인 감사 & 기계가독형 피드백) │
                    └───────────────┬───────────────┘
                                    │ Defect Feedback & Re-loop
                                    └───────────────► (Back to Planner/Developer)
```

## 2. 4대 핵심 에이전트 라이프사이클 및 책임

### 1) Quality Planner (`.agents/agents/quality-planner/agent.md`)
- **역할**: 수석 게임 기획자 & 수용 기준 설계관 (Requirements & Acceptance Architect)
- **책임**:
  - `CLASSIC_SPEC.md` 및 `maple_classic_compendium.md` 기반 정통 고증 명세 분석
  - 로그인 $\rightarrow$ 캐릭터 선택 로비 $\rightarrow$ 4/4 주사위 캐릭터 생성의 클래식 UX 수용 기준 수립
  - 5대 인벤토리(장비, 소비, 기타, 설치, 캐시) 및 아이템 UUID/인챈트 메타데이터 규격 정의
  - 서버 크래시 방어(Zero-Loss Persistence) 및 Tier 1 즉시 저장 정책의 정량적 기준 수립
- **불변 원칙**: 모호한 구두 기획 금지. 모든 요구사항은 실행 검증 가능한 정량 수치와 검증 시나리오로 명시.

### 2) Core Developer (`.agents/agents/core-developer/agent.md`)
- **역할**: 수석 시스템 아키텍트 & 테크니컬 아티스트 (System & Engine Developer)
- **책임**:
  - `js/physics.js`, `js/map.js`: 선분 발판, 사다리 흡착, 60Hz 고정 시간 스텝
  - `server.py`: SQLite WAL 저널링 강제(`PRAGMA journal_mode=WAL`), Graceful Shutdown 핸들러, Tier 1 즉시 트랜잭션 커밋
  - `js/entities.js`, `js/combat.js`: 33종 스킬, 히트스탑, 넉백 임계치, 자쿰 8개 팔 다중 파츠 레이드
  - `js/network.js`, `js/game.js`: 브라우저 종료 방어(`beforeunload` + `sendBeacon`), 안전 스폰(3초 i-Frame)
- **불변 원칙**: 축약 코드(`// ...기존 코드...`) 금지, 노 하드코딩 키, 값싼 도형(Cheap Shapes) 금지.

### 3) Test QA Engineer (`.agents/agents/test-qa-engineer/agent.md`)
- **역할**: 테스트 자동화 수석 엔지니어 (Test & QA Automation Engineer)
- **책임**:
  - `run_qa.py` (Chrome DevTools Protocol 기반 헤드리스 브라우저 8대 무결점 테스트) 집행
  - 브라우저 콘솔 런타임 예외 0건(0 Runtime Errors) 및 DOM 레이아웃, 물리 발판 접지 검증
  - 로그인/로비 전환 및 서버 강제 종료 시 데이터 보존 시뮬레이션 검증
- **불변 원칙**: '예외 미발생' 판정에 안주하지 않고, 시각적 일치성(문워크 방지, 스케일링)과 물리 무결성 검증.

### 4) Quality Controller (`.agents/agents/quality-controller/agent.md`)
- **역할**: 무인 감사관 & 기계 가독형 피드백 디스패처 (Automated Audit & Feedback Dispatcher)
- **책임**:
  - QA 결과와 수용 기준의 일치성 자동 감사
  - 결함 발견 시 기여자의 LLM이 즉시 패치할 수 있는 구조화된 에러 리포트 및 패치 가이드 산출
  - 무결점 합격 시 자율 머지 서명(Quality Sign-off) 부여

---

## 3. 클래식 조사 → 웹 구현 → 실제 검토 전문 역할

| 전문 역할 | 지침 | 핵심 책임 |
| --- | --- | --- |
| **Classic Researcher** | [classic-researcher/agent.md](agents/classic-researcher/agent.md) | GMS 62 및 클래식 넥슨 데이터 서비스 기반 원본 근거, 스킬 딜레이(ms), 스탯 공식 추출 |
| **Web Client Developer** | [web-client-developer/agent.md](agents/web-client-developer/agent.md) | 브라우저 바닐라 JS 구현, 로비/주사위 UI, 캔버스 최적화, 네트워크 동기화 |
| **Implementation Reviewer** | [implementation-reviewer/agent.md](agents/implementation-reviewer/agent.md) | 기여 LLM의 코드 diff를 독립 검토하고 머신 가독형 피드백 생성 (사람의 코드 리뷰 대체) |

---

## 4. 무인 자율 개발 루프 (Agent-to-Agent Loop)

사람이 코드를 직접 열어보고 판단하지 않습니다. 다음과 같은 증거 기반 자율 루프로 프로젝트가 진화합니다:

1. **의도 정의 (Human)**: 사람이 구현하고자 하는 목표(예: "4/4 주사위 캐릭터 생성 모달 구현")를 기획자/개발자 에이전트에게 전달.
2. **사양 수립 (Quality Planner)**: 수용 기준(Acceptance Criteria)과 변경 대상 파일 정의.
3. **자율 구현 (Core Developer / Web Client Developer)**: `AGENTS.md`의 11대 규칙을 준수하며 모듈 파일 수정.
4. **실행 시뮬레이션 (Test QA Engineer)**: Chrome CDP 헤드리스 환경에서 실제 브라우저를 띄워 조작 검증 및 콘솔 에러 감사 (`python run_qa.py`).
5. **무인 독립 감사 (Implementation Reviewer & Quality Controller)**: 기계 가독형 피드백(실패 시 개발 에이전트에게 재전송) 또는 무결점 서명 부여.
6. **자율 머지 (Auto-Merge)**: 모든 검증 통과 시 레포지토리에 반영.

**에이전트 파일이나 계획서 작성은 구현 완료가 아닙니다.** 실제 요구사항이 구현되고 실행·시각·상태 검증으로 확인될 때까지 루프를 계속합니다.
