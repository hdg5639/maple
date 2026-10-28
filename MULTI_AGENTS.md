# 🍁 OpenMaple Classic: Multi-Agent Collaboration Architecture & Operational Protocols
> **Version: 2.0-Production**  
> **Target Engine: Pure Vanilla Web 2D Classic Maple Engine**  
> **Philosophy: Zero Cheap Prototypes, 100% Production Juice, Closed-Loop Anti-Regression**

---

## 1. 개요 및 멀티에이전트 협업 패러다임 (Overview)

OpenMaple Classic은 2000년대 빅뱅 이전 메이플스토리 엔진의 정밀한 물리, 그래픽, 전투 타격감, 경제 시스템을 재현하는 고도화된 웹 게임 클라이언트입니다.
단일 AI 에이전트가 전체 코드를 주먹구구식으로 다루는 과정에서 발생하는 **'기획 누락', '물리 발판 뚫림 회귀', 'UI 깨짐', '스탯 연산 오차'**를 방지하기 위해, 시스템을 **5대 전문 도메인 에이전트(Specialized Agents)**로 분할하여 협업하도록 강제합니다.

```
                    ┌─────────────────────────────────┐
                    │      Chief Orchestrator         │
                    │   (Lead Game Client Director)   │
                    └────────────────┬────────────────┘
                                     │
         ┌──────────────┬────────────┴───┬──────────────┬──────────────┐
         ▼              ▼                ▼              ▼              ▼
┌────────────────┐ ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Game Designer │ │Physic & Combat│ │ UI/UX & Econ │ │ Art & Audio  │ │QA Automation │
│     Agent      │ │    Agent      │ │    Agent     │ │    Agent     │ │    Agent     │
└────────────────┘ └───────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 2. 5대 전문 서브에이전트 역할 및 책임 (Roles & Responsibilities)

### 🎯 1. Lead Game Designer Agent (수석 기획 에이전트)
- **책임 영역**: 
  - 빅뱅 이전 공식 명세서(`CLASSIC_SPEC.md`) 고증 및 게임 루프 무결성 감시.
  - 레벨 디자인, 스탯 배분, 직업별 스킬 밸런스, 퀘스트 저널, 아이템 드롭률 공식 수립.
- **불변 원칙 (Invariant)**:
  - '사냥 -> 루팅 -> 마을 상점 판매 -> 장비/물약 구매 -> 상위 던전 도전'의 코어 루프가 끊기지 않아야 함.
  - 레벨업 시 순수 스탯과 보너스 스탯의 일치성을 보장하고 허위/임의 계수 조작을 불허함.

### ⚔️ 2. Physics & Combat Agent (물리 및 전투 엔진 에이전트)
- **책임 영역**: 
  - `js/physics.js`, `js/combat.js`, 발판(Foothold) 선분 방정식 및 사다리 흡착.
  - 60Hz 고정 시간 스텝 물리 누적기, Swept AABB 충돌, 넉백 및 피격 무적(i-Frame).
- **불변 원칙 (Invariant)**:
  - 경사면 보간식 $y = y_1 + \frac{y_2 - y_1}{x_2 - x_1}(x - x_1)$에서 어떠한 프레임 드랍에서도 발판 밑으로 관통(Tunneling)되지 않아야 함.
  - 동시 방향키 입력 시 **Last-Key-Wins** 우선순위를 물리 벡터에 즉시 동기화할 것.

### 💰 3. UI/UX & Economy Agent (인터페이스 및 경제 에이전트)
- **책임 영역**: 
  - `js/ui.js`, `js/shop.js`, `js/storage.js`, `js/keyconfig.js`.
  - 클래식 메이플 드래그 창(스탯, 인벤토리, 장비창, 퀘스트창, 상점 모달, 단축키창).
  - 브라우저 로컬 저장소(`LocalStorageManager`)를 통한 캐릭터 영속성(Persistence).
- **불변 원칙 (Invariant)**:
  - 브라우저 새로고침(F5) 후에도 직전 레벨, 장비 장착 상태, 인벤토리, 메소, 단축키가 100% 무결하게 복원되어야 함.
  - 상점에서 아이템 구매/판매 시 메소와 인벤토리 슬롯의 정합성이 실시간 보장되어야 함.

### 🎨 4. Technical Art & Audio Agent (테크니컬 아티스트 & 사운드 에이전트)
- **책임 영역**: 
  - `js/sprites.js`, `js/audio.js`, 캔버스 2D 렌더링 파이프라인.
  - 자릿수 시차 대미지 폰트 바운스, 피격 실루엣 플래시, 몬스터 애니메이션, 착지 파티클.
  - Web Audio API 프로시저럴 음향 합성 및 BGM 엔진.
- **불변 원칙 (Invariant)**:
  - 값싼 단색 기하 도형(`fillRect`, `arc`)을 플레이어/몬스터 스프라이트로 그리는 것을 엄격히 금지함.
  - 캐릭터가 우측을 볼 때만 `ctx.scale(-1, 1)` 수평 반전하며 이름표/말풍선은 절대 뒤집히지 않아야 함 (Anti-Moonwalk).

### 🧪 5. QA Automation Agent (자동화 QA & 결함 탐지 에이전트)
- **책임 영역**: 
  - `run_qa.py`, `game_qa_suite.py`, Chrome DevTools Protocol(CDP) 기반 헤드리스 전수 검증.
  - 전 맵 순회, 보스 타격, 키 바인딩, 세이브/로드, 콘솔 런타임 에러 0건 유지.
- **불변 원칙 (Invariant)**:
  - 어떠한 코드 변경 후에도 `python run_qa.py`를 즉각 통과해야 하며 콘솔 에러가 단 1건이라도 발생하면 커밋을 거부함.

---

## 3. 에이전트 간 핸드오프 및 안티 리그레션 프로토콜 (Anti-Regression Protocol)

1. **상태 변경 시 상호 알림 (Event Handshake)**:
   - 예: `Economy Agent`가 인벤토리 아이템을 변경하면 -> `Combat Agent`의 `calcDerivedStats()`가 즉각 호출되어 공격력/방어력이 재계산되어야 함.
2. **저장 트리거 룰 (Save Trigger Contract)**:
   - 경험치 획득, 레벨업, 장비 변경, 상점 거래, 퀘스트 완료 시 `LocalStorageManager.save()`가 동기식으로 호출되어 데이터 유실을 0%로 통제함.
3. **QA 서명 필수 원칙 (Sign-off Rule)**:
   - 모든 기능 배포 전 `QA Automation Agent`의 헤드리스 스위트가 실행되어 '0 Exceptions, Closed-loop Verification' 인증을 획득해야 함.
