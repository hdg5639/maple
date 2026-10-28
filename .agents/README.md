# 🍁 OpenMaple Loop Engineering Multi-Agent Architecture

## 1. Loop Engineering Overview (루프 엔지니어링 개요)
OpenMaple은 2000년대 빅뱅 이전 넥슨 클래식 메이플스토리 엔진의 정밀한 물리, 그래픽, 전투 타격감, UI/UX를 100% 웹 바닐라 환경에서 재현하는 프로젝트입니다.
기획 누락, 물리 발판 뚫림 버그, 입력 충돌, UI 오버랩 등의 품질 결함을 원천 차단하기 위해 **품질 계획(Plan) -> 코어 구현(Develop) -> 자동화 검증(Test) -> 품질 통제 및 피드백 루프(Control)**의 폐쇄형 루프 엔지니어링(Closed-Loop Engineering)을 강제합니다.

```
                    ┌───────────────────────────────┐
                    │     1. Quality Planner        │
                    │  (품질 계획 & 요구사항 수립)    │
                    └───────────────┬───────────────┘
                                    │ Spec & Checklist
                                    ▼
                    ┌───────────────────────────────┐
                    │     2. Core Developer         │
                    │  (엔진, 그래픽, 물리, 시스템 구현)│
                    └───────────────┬───────────────┘
                                    │ Executable Client
                                    ▼
                    ┌───────────────────────────────┐
                    │     3. Test QA Engineer       │
                    │  (4-Tier 자동화 헤드리스 검증)  │
                    └───────────────┬───────────────┘
                                    │ Pass/Fail Logs & Screenshots
                                    ▼
                    ┌───────────────────────────────┐
                    │    4. Quality Controller      │
                    │  (결함 분석 & 감사 & 피드백 루프)│
                    └───────────────┬───────────────┘
                                    │ Defect Feedback & Re-planning
                                    └───────────────► (Back to Planner)
```

## 2. 4대 라이프사이클 전문 에이전트

### 1) Quality Planner (`.agents/agents/quality-planner/agent.md`)
- **역할**: 수석 게임 기획자 & 품질 계획가 (Quality Assurance & Requirements Architect)
- **책임**:
  - `CLASSIC_SPEC.md` 및 공식 메이플 고증 명세 분석
  - 기능 요구사항(FR) 및 비기능 품질 KPI(9대 지표) 정의
  - 단계별 검증 체크리스트 및 추적 매트릭스(Traceability Matrix) 생성
- **불변 원칙**: 모호한 구두 기획 금지. 모든 기능은 측정 가능한 정량적 품질 기준(FPS, 응답성, 무결성)을 사전에 명시해야 함.

### 2) Core Developer (`.agents/agents/core-developer/agent.md`)
- **역할**: 수석 게임 클라이언트 아키텍트 & 테크니컬 아티스트 (Senior Game Engine & Client Developer)
- **책임**:
  - `js/physics.js`: 선분 발판(Foothold), 사다리/밧줄 흡착, 60Hz 고정 시간 스텝 물리 누적기
  - `js/entities.js`, `js/combat.js`: 플레이어, 몬스터, 보스(자쿰 8개 팔), 타격 판정 및 넉백
  - `js/skills.js`, `js/skill_icons.js`: 33종 전직 스킬, 0-MP 평타/기본스킬, 32x32 벡터 SVG 아이콘
  - `js/sprites.js`: 2등신 페이퍼돌 렌더링, 시차 대미지 폰트, 무기/표창 렌더링
  - `js/ui.js`, `js/keyconfig.js`: 반응형 HUD, 충돌 없는 단축키 시스템, 무기 보급고
- **불변 원칙**: 값싼 단색 기하도형 금지, Last-Key-Wins 원칙 준수, 단일 프레임 엔티티 소멸 금지(사망 애니메이션 및 포물선 드랍 필수).

### 3) Test QA Engineer (`.agents/agents/test-qa-engineer/agent.md`)
- **역할**: 테스트 자동화 수석 엔지니어 (Senior Test & QA Automation Engineer)
- **책임**:
  - 4-Tier 다계층 검증 파이프라인(`test_multi_tier_pipeline.py`) 및 회귀 테스트(`run_qa.py`, `game_qa_suite.py`) 집행
  - Chrome DevTools Protocol(CDP) 기반 헤드리스 브라우저 실시간 캡처 및 DOM 상태 검증
  - 브라우저 콘솔 런타임 예외 0건(0 Runtime Errors) 엄격 강제
- **불변 원칙**: '예외 0건'뿐만 아니라 시각적/기획적 결함(문워크, 부유 몬스터, 밧줄 지터, 키 충돌)을 시뮬레이션으로 철저히 색출함.

### 4) Quality Controller (`.agents/agents/quality-controller/agent.md`)
- **역할**: 품질 통제관 & 감사관 (Chief Quality Control Auditor)
- **책임**:
  - QA 결과 데이터와 품질 계획서의 9대 KPI 실측 비교 감사
  - 결함 원인(Root Cause)의 다차원 분석 및 아키텍처 한계점 진단
  - 시정 조치 요구서(Corrective Action Request) 발행 및 차기 스프린트 피드백 루프 완결
- **불변 원칙**: 품질 타협 불가. 모든 결함은 폐쇄형 루프(Closed-Loop)를 통해 해결될 때까지 배포를 차단함.
