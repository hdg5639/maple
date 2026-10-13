# 🍁 오픈메이플 클래식 (OpenMaple Classic)

> **2000년대 빅뱅 이전(Pre-Big Bang) 메이플스토리 엔진의 감성과 물리를 웹 표준 환경에서 완벽히 재현한 순수 바닐라 2D 게임 클라이언트**

[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-brightgreen.svg)](#-핵심-엔진-특징)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%202D-orange.svg)](#-핵심-엔진-특징)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-blue.svg)](#-사운드-엔진)
[![Headless CDP QA](https://img.shields.io/badge/QA-Chrome%20CDP%20Passed-success.svg)](#-자동화-qa-검증)

---

## 🌟 프로젝트 소개 (Overview)

OpenMaple Classic은 넥슨(Nexon)의 전성기 클래식 메이플스토리(2003~2010년 빅뱅 이전) 특유의 **선분 발판 물리(Foothold Line Math), 2등신 페이퍼돌 그래픽, 자릿수 시차 대미지 스킨 바운스, 자쿰 보스 레이드, 지능형 A\* 자동사냥**을 순수 HTML5/CSS3/JavaScript로 구현한 웹 게임 클라이언트입니다.

외부 번들러(Webpack, Vite)나 프레임워크(React, Vue) 없이, 웹 브라우저만 있으면 로컬에서 즉시 60FPS로 구동됩니다.

---

## 🕹️ 핵심 기능 및 시스템 (Key Features)

### 1. 🗺️ 공식 WZ 추출 5대 월드 맵 (Multi-Map World)
원작 WZ 데이터의 발판 선분 좌표와 사다리를 정밀 추출하여 5개 테마 맵을 완벽 구현했습니다:
- **헤네시스 사냥터 1 (`henesys_hhg`)**: 153개 발판, 8개 사다리/밧줄, 달팽이/슬라임/주황버섯 서식, 단풍나무와 버섯 언덕.
- **헤네시스 마을 (`henesys_town`)**: 220개 발판, 장로스탄, 마야, 중형택시 NPC, 버섯 초가집 테마.
- **던전: 개미굴 1 (`ant_tunnel`)**: 909개 발판, 20개 사다리, 좀비버섯/뿔버섯, 뼈사다리와 종유석 동굴.
- **요정의 마을: 엘리니아 (`ellinia`)**: 1,217개 발판, 37개 사다리, 거대 에메랄드 세계수 수직 지형.
- **보스 필드: 자쿰의 제단 (`zakum_altar`)**: 166개 발판, 용암 배경, 아도비스 NPC, 8개 팔을 지닌 거대 보스 자쿰 전용 필드.

### 2. 👑 8개 부속 팔 자쿰 보스 레이드 (Zakum Boss Raid)
- **100,000 HP 거대 본체 + 8개의 독립 부속 팔 (각 15,000 HP)**
- 각 팔은 독립된 피격 판정, HP 게이지, 부유 사인파 애니메이션, 대미지 폰트 연동, 파괴 이펙트를 가집니다.
- 주기적인 불기둥(`fire_pillar`), 벼락 낙뢰(`lightning`) 광역 기믹.
- 처치 시 **'자쿰의 투구(Zakum Helmet)'**, 10만 메소 다발, 엘릭서 등 고유 전리품 투하.
- 화면 상단 전용 와이드 보스 체력바 제공.

### 3. ⚔️ 5대 모험가 직업군 및 전투 스킬
- **초보자 (Beginner)**: 달팽이 세껍질, 기본 타격.
- **전사 (Warrior)**: 파워 스트라이크(단일 폭딜), 슬래시 블러스트(다수 관통기).
- **마법사 (Magician)**: 에너지 볼트, 매직 클로(2연타 마법).
- **궁수 (Bowman)**: 더블 샷(2연사 원거리 화살 투사체).
- **도적 (Thief)**: 럭키 세븐(2연속 럭키 표창 투사체), 플래시 점프(고속 공중 도약).

### 4. 🤖 지능형 위상 그래프 자동사냥 (Auto-Hunt AI)
- **위상 발판 그래프 (Foothold Graph)**: 맵 로드 시 발판(노드)과 사다리/하향낙하지점(에지)을 전수 분석하여 그래프를 자동 생성.
- **A\* 최단 경로 탐색**: 몬스터가 다른 층에 위치할 때 최적의 사다리 등반 및 하향 점프 경로를 산출하여 이동.
- **자동 루팅 (Auto-Loot) & 자동 물약 (Auto-Potion)**: 필드에 드롭된 메소와 아이템 우선 수거, HP/MP 임계치 이하 시 자동 섭취.
- **끼임 방지 (Anti-Stuck Watchdog)**: 0.5초간 변위가 10px 미만일 시 명령을 강제 취소하고 무작위 회피 도약 수행.
- **실시간 통계**: 사냥 시간, 처치 수, 분당 경험치(EXP/min), 분당 메소(Meso/min) 계측.

### 5. 🚕 NPC 대화 & 모범택시 시스템
- NPC(모범택시, 중형택시, 장로스탄, 베티, 마야, 아도비스) 근처에서 `Space` 키 입력 시 전용 양피지 다이얼로그 팝업.
- 목적지 선택 시 대륙 간 즉시 텔레포트 이동 지원.

### 6. 💬 인게임 채팅 & 말풍선 & 루팅 로그
- **하단 채팅창**: `[ALL]`, `[파티]`, `[길드]` 탭 지원 및 엔터키 입력.
- **머리 위 말풍선**: 입력한 대화가 캐릭터 머리 위에 4초간 클래식 말풍선(`Speech Bubble`)으로 렌더링.
- **우측 하단 루팅 로그**: 경험치, 메소, 아이템 획득 시 3.2초간 페이드아웃되는 플로팅 알림 로그.

### 7. 🔊 Web Audio API 프로시저럴 사운드 엔진
- 외부 MP3/WAV 파일 의존성 없이, 브라우저 오실레이터로 레트로풍 메이플 BGM 및 타격/점프/아이템/포션 효과음을 100% 프로시저럴 합성.

---

## 🎮 키 조작법 (Controls)

| 분류 | 키 (Key) | 기능 (Function) |
| :--- | :--- | :--- |
| **이동** | `←`, `→` | 좌우 이동 (공중 관성 및 마찰 적용) |
| **점프** | `Alt` 또는 `C` | 점프 ($v_{jump} = -9.8$) |
| **하향 점프** | `↓` + `Alt` | 발판 아래로 관통 낙하 (`dropThroughUntilY`) |
| **사다리/밧줄** | `↑`, `↓` | 사다리 중심선($\pm 12\text{px}$) 흡착 및 등반 |
| **기본 공격** | `Ctrl` | 기본 근접 무기 휘두르기 |
| **스킬 1** | `Shift` / `Q` | 파워 스트라이크 (전사) |
| **스킬 2** | `W` | 슬래시 블러스트 (전사) |
| **스킬 3** | `E` | 매직 클로 (마법사) |
| **이동 스킬** | `F` | 플래시 점프 (도적) |
| **아이템 줍기**| `Z` | 바닥의 메소 동전/주머니 및 아이템 수거 |
| **상호작용** | `Space` | NPC 대화창 열기 / 포탈 타기 |
| **포션 섭취** | `1`, `2` | 빨간 포션(HP 50), 파란 포션(MP 50) 복용 |
| **자동사냥** | `R` | **⚡ 지능형 자동사냥 ON / OFF** |
| **보스 소환** | `B` | **👑 머쉬맘 소환 (헤네시스 필드)** |
| **UI 창 토글**| `S` (스탯), `I` (인벤토리), `K` (스킬), `O` (자동사냥 설정) | 클래식 드래그 창 열기/닫기 |

---

## 🚀 실행 방법 (Getting Started)

### 방법 1. 원클릭 실행 (Windows)
프로젝트 루트의 `run.bat` 파일을 더블 클릭하면 브라우저가 즉시 실행됩니다.

### 방법 2. Python 로컬 서버 실행 (권장)
```powershell
python server.py
```
실행 즉시 기본 브라우저(`http://localhost:8000`)가 열립니다.

### 방법 3. 브라우저로 직접 열기
`index.html` 파일을 크롬(Chrome), 엣지(Edge), 파이어폭스, 웨일 브라우저로 드래그 앤 드롭하여 바로 실행할 수 있습니다.

---

## 🏗️ 프로젝트 아키텍처 및 문서 (Documentation)

자세한 시스템 설계 및 기여 규격은 아래 전용 문서들을 참조하십시오:

- [📜 CLASSIC_SPEC.md](./CLASSIC_SPEC.md): 빅뱅 이전 메이플스토리 공식 고증 명세서 (5대 직업 계통도, 대미지/명중률 공식, 인기도, 몬스터/보스 생태계)
- [🏛️ ARCHITECTURE.md](./ARCHITECTURE.md): 시스템 아키텍처 및 런타임 수명 주기, 60Hz 누적기, 선분 발판 수학 명세서
- [🤝 CONTRIBUTING.md](./CONTRIBUTING.md): 신규 맵/몬스터/스킬 추가 가이드 및 개발/기여 규격
- [🤖 AGENTS.md](./AGENTS.md): AI 코딩 에이전트 불변 행동 강령 및 표준 지침
- [🎯 .cursorrules](./.cursorrules): Cursor AI 전용 프로젝트 룰셋
- [🐙 .github/copilot-instructions.md](./.github/copilot-instructions.md): GitHub Copilot 전용 지침
- [🧠 CLAUDE.md](./CLAUDE.md): Claude Code / Claude 프로젝트 전용 지침

---

## 🧪 자동화 QA 검증 (Automated Testing)

본 프로젝트는 Headless Chrome DevTools Protocol(CDP) 기반 자동화 QA 러너를 탑재하고 있습니다.  
전체 맵 순회, 보스 레이드, 스킬 연계, UI 조작 중 발생하는 브라우저 콘솔 에러를 실시간으로 감지합니다.

```powershell
python run_qa.py
```

- **검증 항목**:
  - 5개 전 맵 순회 (`henesys_hhg` $\to$ `henesys_town` $\to$ `ant_tunnel` $\to$ `ellinia` $\to$ `zakum_altar`)
  - 자쿰 8개 팔 타격 및 대미지 폰트 연동
  - 자동사냥 토글 및 A* 위상 그래프 재구축
  - 브라우저 콘솔 런타임 예외 0건 (`Browser Console Errors: 0`)
  - 실시간 게임 렌더링 스크린샷 자동 생성 (`qa_live_screenshot.png`)

---

## 📜 라이선스 및 저작권 (License & Disclaimer)

본 프로젝트는 비영리 팬메이드 및 학술적/아키텍처 연구 목적으로 제작되었습니다.  
메이플스토리(MapleStory) 및 모든 관련 리소스의 저작권은 ㈜넥슨코리아(Nexon Korea)에 귀속됩니다.
