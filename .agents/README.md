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

## 3. 클래식 조사 → 웹 구현 → 실제 검토 전문 역할

기존 네 가지 라이프사이클 역할을 유지하면서, 사용자가 요청한 세 단계의 책임을 다음 파일로 구체화합니다.

| 전문 역할 | 지침 | 기존 역할과의 연결 |
| --- | --- | --- |
| Classic Researcher | [classic-researcher/agent.md](agents/classic-researcher/agent.md) | Quality Planner에게 버전별 원본 근거와 측정 가능한 수용 기준 전달 |
| Web Client Developer | [web-client-developer/agent.md](agents/web-client-developer/agent.md) | Core Developer의 구현 책임 수행, Test QA Engineer와 실행 검사 |
| Implementation Reviewer | [implementation-reviewer/agent.md](agents/implementation-reviewer/agent.md) | Test QA Engineer의 실행 결과를 독립 검토하고 Quality Controller에게 감사 근거 전달 |

기본 고증 버전은 **GMS 62**입니다. 다른 지역·시기·현대 메이플 자료를 혼합하지 않으며, 원본과 다른 편의 기능이나 보충 지형은 구현 선택으로 명시합니다. 맵·몬스터 ID, 표시 이름, 스프라이트, 좌표 변환은 각각 확인합니다.

## 4. 증거를 기준으로 다시 도는 개발 루프

실제 결함 이력, 원본 출처, 좌표 관측과 QP/QA/QC 수용 조건은 [CLASSIC_RESEARCH_AND_QA.md](../CLASSIC_RESEARCH_AND_QA.md)에 연결합니다. 새 작업과 회귀 결함을 처리할 때 해당 등록부의 영향 ID를 계획·검사·감사 기록에 포함합니다.

1. **조사**: 출처·지역·버전·ID·필드와 재현된 실제 동작을 기록합니다. 원본 데이터도 PNG, 좌표계, 자산과 대조합니다.
2. **수용 기준**: 요구사항을 상태·위치·수치·시각 결과로 검증할 수 있도록 정의하고 구현 모듈과 검사에 연결합니다.
3. **구현**: 소유 파일을 정해 실제 게임을 수정하고 호출부·데이터·UI를 일관되게 맞춥니다.
4. **실행 검증**: 현재 코드로 회귀·통합 QA를 실행하고, 실제 브라우저의 화면과 상태 값을 확인합니다. 예외 0건이나 API 존재만으로 통과시키지 않습니다.
5. **독립 검토**: 원본 근거와 구현·실행 결과를 대조합니다. 결함을 찾으면 원인에 맞는 조사·계획·구현·검사 단계로 되돌아갑니다.
6. **서명과 보고**: 실패했던 검사를 재실행하고 관련 통합 검사가 통과한 증거를 Quality Controller가 확인합니다. 구현 범위, 검증 결과, 남은 원작 차이와 제한을 구분하여 보고합니다.

**에이전트 파일이나 계획서 작성은 구현 완료가 아닙니다.** 실제 요구사항이 구현되고 실행·시각·상태 검증으로 확인될 때까지 루프를 계속합니다. 품질 서명은 사용자에게 추가 승인을 요구하기 위한 단계가 아니라, 완료 주장을 실행 증거에 연결하는 내부 검증 기록입니다.

## 5. 현재 월드 조사 근거와 원작 차이 추적

2026-10-29에 확인한 아래 자료는 MapleStory.IO의 **GMS 62 데이터 서비스**입니다. 넥슨 공식 설명서와 구분하여 인용합니다. 원본 JSON과 전체 레이어 렌더 이미지는 조사 중 `scratch_scripts/world_source/`에 보관하며, 재현 가능한 외부 출처는 다음과 같습니다.

| 대상 | 출처 | 원본에서 확인한 내용 |
| --- | --- | --- |
| 헤네시스 사냥터 I | [map/104040000](https://maplestory.io/api/GMS/62/map/104040000) | `Henesys Hunting Ground I`, `isTown=false`, 몬스터 스폰 40개, NPC 0개 |
| 헤네시스 마을 | [map/100000000](https://maplestory.io/api/GMS/62/map/100000000) | `Henesys`, `isTown=true`, 몬스터 스폰 0개 |
| 개미굴 I | [map/105050000](https://maplestory.io/api/GMS/62/map/105050000) | `Ant Tunnel I`, 원본 선분 498개 중 수직선이 아닌 선분 370개, 사다리·밧줄 11개 |
| 개미굴 광장 | [map/105070001](https://maplestory.io/api/GMS/62/map/105070001) | `Ant Tunnel Park`. 개미굴 I와 서로 다른 맵이므로 ID나 지형을 혼용하지 않음 |
| 엘리니아 | [map/101000000](https://maplestory.io/api/GMS/62/map/101000000) | `Ellinia`, `isTown=true`, 몬스터 스폰 0개 |
| 자쿰의 제단 | [map/280030000](https://maplestory.io/api/GMS/62/map/280030000) | `Zakum's Altar`, 원본 사다리·밧줄 2개, 원본 NPC `Amon` |
| 뿔버섯 | [mob/2110200](https://maplestory.io/api/GMS/62/mob/2110200) | `Horny Mushroom`. 몬스터 ID를 기억으로 이름에 대응하지 않음 |
| 좀비버섯 | [mob/2230101](https://maplestory.io/api/GMS/62/mob/2230101) | `Zombie Mushroom` |
| 좀비 머쉬맘 | [mob/6300005](https://maplestory.io/api/GMS/62/mob/6300005) | `Zombie Mushmom`. 일반 머쉬맘과 이름·색상·이미지를 구분함 |

원본 선분 개수와 런타임 보행 선분 개수는 수직 벽 포함 여부 및 추가 지형에 따라 달라집니다. 누락이나 중복을 검사할 때는 총수만 비교하지 말고 원본 ID와 용도를 함께 대조합니다.

이 조사에서 기존 월드의 잘못된 맵 ID, 안전 마을의 전투 몬스터, 다른 몬스터의 대체 이미지, 도착 Y를 무시하는 최하층 스냅, NPC와 도착 스폰의 근접 배치를 수정 대상으로 확인했습니다. 원본의 미구현 지역을 연결하는 편의 포탈, 축약 NPC, 테스트용 보스 소환과 웹 데모용 보스 체력은 원작 재현과 별개인 구현 정책으로 구분해야 합니다.

기존 지형 PNG 일부는 레이어가 누락되어 있었고 발판 정규화 원점도 그래픽 원점과 달랐습니다. 전체 레이어 이미지를 확보한 뒤 `miniMap`의 중심·범위와 유효한 `vrBounds`, 원본 세계 좌표, 실제 픽셀 표면을 여러 지점에서 대조합니다. 미니맵 중심이나 최하단 발판을 그래픽 원점으로 곧바로 대입하지 않습니다. 전체 렌더에 이미 포함된 밧줄·지형 위에 이전 보충 그림을 중복 렌더하지 않는지도 실행 화면에서 검증해야 합니다.

위 내용은 조사 및 수용 기준의 기록입니다. 실제 코드 반영과 실행·시각·상태 QA, 결함 재검증이 끝나기 전에는 월드 수정 완료나 품질 서명을 뜻하지 않습니다.
