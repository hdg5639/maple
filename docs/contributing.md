# 🤝 OpenMaple Classic 기여 가이드 (Contributing Guidelines)

본 문서는 **OpenMaple Classic** 프로젝트에 새로운 기능(맵, 몬스터, 스킬, 직업, NPC, UI)을 기여하려는 인간 개발자 및 AI 코딩 에이전트(LLM)를 위한 표준 개발 지침서임.

---

## 1. 프로젝트 핵심 철학 및 불변 규칙 (Non-Negotiable Rules)

본 프로젝트는 단순한 데모나 토이 프로젝트가 아닌, **2000년대 클래식 메이플스토리의 조작감, 물리, 시각적 감성을 웹에서 완벽히 보존하는 상용급 클라이언트**를 지향함. 기여 시 다음 규칙을 엄격히 준수해야 함:

### 🚫 절대 금지 사항 (Anti-Patterns)
1. **외부 빌드 도구 및 npm 의존성 도입 금지:**
   - Webpack, Vite, React, Vue, TypeScript, TailwindCSS 등의 설치나 설정 파일 추가를 일절 금지함.
   - 모든 코드는 브라우저가 직접 파싱할 수 있는 순수 바닐라 HTML5, CSS3, ES6 JavaScript여야 함.
2. **단순 기하학적 도형(AABB 박스 / arc 원) 렌더링 금지:**
   - 캐릭터나 몬스터를 단순 사각형이나 원형으로 그리지 말 것.
   - 반드시 공식 WZ 스프라이트 이미지를 로드하거나, `js/sprites.js`의 페이퍼돌 계층형 벡터 오프스크린 캔버스에 굽는(Bake) 방식으로 구현할 것.
3. **가변 델타타임 물리 및 단순 AABB 충돌 금지:**
   - 지형 충돌은 반드시 `js/physics.js`의 선분 발판(`Foothold Line Math`) 방정식을 따를 것.
   - 프레임 변동에 영향을 받지 않도록 고정 60Hz 누적기(`accumulator`) 내부에서만 물리 틱을 실행할 것.
4. **콘솔 런타임 에러 발생 금지:**
   - 사소한 `undefined` 프로퍼티 참조, 미선언 메서드 호출 등 단 1건의 콘솔 에러도 허용하지 않음.
   - 작업 완료 후 반드시 `python run_qa.py`를 실행하여 0 Exception을 검증해야 함.

---

## 2. 모듈 경계 및 전역 네임스페이스 (Module Boundaries)

코드베이스는 역할에 따라 엄격하게 모듈화되어 있으며, 글로벌 스코프에 인스턴스화됨:

| 모듈 인스턴스 | 위치 파일 | 담당 역할 | 타 모듈과의 상호작용 원칙 |
| :--- | :--- | :--- | :--- |
| `window.game` | `js/game.js` | 게임 루프, 입력 이벤트, 씬 상태, 카메라 | 전체 조율자(Orchestrator). 다른 모든 모듈을 멤버로 소유함. |
| `window.game.physics` | `js/physics.js` | 선분 흡착, 점프, 하향점프, 사다리 | 엔티티의 위치와 속도(`x, y, vx, vy`)만 순수하게 계산함. |
| `window.game.map` | `js/map.js` | 발판/사다리 데이터 로드, 패럴랙스 렌더링 | 지형 기하정보 제공. 몬스터/플레이어 렌더링은 호출하지 않음. |
| `window.sprites` | `js/sprites.js` | 페이퍼돌, 몬스터/NPC 스프라이트, 대미지 폰트 | Canvas 그리기 전담. 엔티티 상태 변경 로직을 포함하지 않음. |
| `window.audio` | `js/audio.js` | Web Audio API BGM 및 효과음 합성 | 사운드 출력 전담. 사운드 재생 실패 시에도 게임 루프가 중단되지 않도록 방어 코드 유지. |
| `window.game.autoHunt` | `js/autohunt.js` | 위상 그래프(FootholdGraph), A*, 자동사냥 | 플레이어의 가상 키보드 입력 및 목표 타겟팅을 제어함. |
| `window.game.ui` | `js/ui.js` | DOM HUD, 인벤토리/스탯/스킬 팝업, 채팅창 | DOM 조작 전담. 엔티티 내부 데이터를 읽어서 화면을 갱신함. |

---

## 3. 기능별 추가 및 확장 가이드

### 3.1. 신규 맵 추가하기 (Adding a New Map)
1. **발판 및 사다리 데이터 정의 (`js/map_data.js`):**
   ```javascript
   MAP_DATA['my_new_map'] = {
     name: '새로운 사냥터',
     bgm: 'field', // audio.js 테마
     bounds: { minX: 0, maxX: 3000, minY: -600, maxY: 1200 },
     spawnPoints: [{ x: 500, y: 300 }],
     backgroundType: 'henesys', // 패럴랙스 배경 타입
     portals: [
       { x: 2800, y: 300, targetMap: 'henesys_hhg', targetSpawn: 0 }
     ],
     npcs: [
       { id: 'regular_cab', name: '중형택시', x: 700, y: 300 }
     ],
     mobSpawns: [
       { type: 'orange_mushroom', count: 12, area: { minX: 200, maxX: 2600, y: 300 } }
     ],
     footholds: [
       { id: 1, x1: 100, y1: 300, x2: 2900, y2: 300 }
       // 선분 발판 정의: 경사면의 경우 y1 !== y2
     ],
     ladders: [
       { id: 1, x: 1200, y1: 100, y2: 300, isRope: false }
     ]
   };
   ```
2. **위상 그래프 갱신 보장 (`js/game.js`):**
   - 맵 전환 함수 `loadMap(mapKey)` 내에서 반드시 다음 구문이 실행되는지 확인할 것:
   ```javascript
   this.map.loadMap(mapKey);
   if (this.autoHunt) {
     this.autoHunt.graph = new FootholdGraph(this.map); // 그래프 재구축 필수
   }
   ```

### 3.2. 신규 몬스터 추가하기 (Adding a New Monster)
1. **스프라이트 등록 (`js/sprites.js`):**
   - WZ 추출 이미지가 있는 경우 `loadMonsterSprites(name)`에 등록하거나,
   - 오프스크린 캔버스에 2단 셀 셰이딩 + 외곽선(`rgba(20, 20, 20, 0.85)`)을 입혀 렌더링 함수 구현.
2. **몬스터 클래스 정의 또는 팩토리 등록 (`js/entities.js`):**
   - `Monster` 기본 클래스를 상속받거나 사양 등록:
   ```javascript
   MONSTER_SPECS['dark_stump'] = {
     name: '다크 스텀프',
     level: 10,
     maxHp: 250,
     exp: 28,
     speed: 35,
     touchDamage: 32,
     drops: [
       { id: 'meso', rate: 0.6, min: 20, max: 45 },
       { id: 'potion_red', rate: 0.15 }
     ]
   };
   ```
3. **피격 리액션 확인:**
   - `hit(damage, hitDir)` 호출 시 히트스탑, 흰색 플래시, 넉백, 대미지 폰트 파티클 생성이 정상 연동되는지 확인할 것.

### 3.3. 신규 스킬 추가하기 (Adding a New Skill)
1. **스킬 명세 정의 (`CLASSIC_SPEC.md` 참조):**
   - 소모 MP, 대미지 퍼센트, 타겟 수, 타격 횟수, 투사체 여부 결정.
2. **플레이어 클래스에 스킬 메서드 구현 (`js/entities.js`):**
   ```javascript
   useSkill(skillKey) {
     // 1. MP 소모 검사
     if (this.mp < skillCost) return false;
     this.mp -= skillCost;
     // 2. 공격 애니메이션 및 쿨타임 설정
     this.state = 'attack';
     this.attackCooldown = 0.5;
     // 3. 사운드 재생
     window.audio.playSkillSound(skillKey);
     // 4. 히트박스 또는 투사체 생성
     // ...
   }
   ```
3. **타격감 및 이펙트 연출 (`js/sprites.js`):**
   - 스킬 이펙트 파티클 및 대미지 스킨(일반 / 크리티컬) 튀어오름 연동.

---

## 4. 검증 및 품질 보증 (QA Workflow)

모든 코드 수정 후에는 아래 절차를 반드시 거쳐야 함:

1. **로컬 서버 정상 구동 확인:**
   ```powershell
   python server.py
   ```
2. **Chrome CDP 무결점 헤드리스 테스트 실행:**
   ```powershell
   python run_qa.py
   ```
   - **판정 기준:**
     - `Browser Console Errors: 0`
     - 모든 맵 순회(`henesys_hhg`, `henesys_town`, `ant_tunnel`, `ellinia`, `zakum_altar`) 성공
     - 자쿰 보스 8개 팔 타격 및 파괴 성공
     - 자동사냥 ON/OFF 전환 성공
     - 스크린샷(`qa_live_screenshot.png`) 정상 생성 확인

---

## 5. Git 커밋 메시지 규칙

커밋 메시지는 명확한 작업 범위를 명시함:
- `feat: [모듈명] 신규 기능 설명` (예: `feat: add ant tunnel zombie mushroom mob`)
- `fix: [모듈명] 버그 수정` (예: `fix: resolve ladder snapping offset glitch`)
- `refactor: [모듈명] 코드 개선` (예: `refactor: optimize damage skin blit cache`)
- `docs: [문서명] 문서 보강` (예: `docs: update ARCHITECTURE.md and CONTRIBUTING.md`)
