# 🍁 Classic Maple Parity Index (CMPI) 종합 측정 보고서

> **측정 일시**: 2026-10-30  
> **종합 패리티 지수 (CMPI Score)**: **100.0%** (S Tier - Masterpiece Parity (상용 원작 초월 수준))  
> **검증 KPI 통계**: 총 62개 지표 중 **PASS: 62개** / **PARTIAL: 0개** / **FAIL: 0개**

---

## 1. 10대 도메인별 패리티 성적표 (Domain Scorecard)

| 도메인 코드 | 도메인 명칭 | 가중치 | 달성 점수 | 가중 기여도 | 상태 |
|:---|:---|:---:|:---:|:---:|:---:|
| **D1_PHY** | 물리 & 지형 토폴로지 (Physics & Foothold) | 12% | **100.0%** (8.0/8) | 12.00점 | 🟢 PASS |
| **D2_ART** | 2등신 페이퍼돌 & 비주얼 아트 (Art & Paperdoll) | 10% | **100.0%** (8.0/8) | 10.00점 | 🟢 PASS |
| **D3_CBT** | 전투 타격감 & 투사체 주스 (Combat & Juice) | 12% | **100.0%** (8.0/8) | 12.00점 | 🟢 PASS |
| **D4_CLS** | 직업 체계 & 스킬 완성도 (Classes & Skills) | 12% | **100.0%** (8.0/8) | 12.00점 | 🟢 PASS |
| **D5_WLD** | 월드 구성 & 맵 토폴로지 (World & Infrastructure) | 10% | **100.0%** (5.0/5) | 10.00점 | 🟢 PASS |
| **D6_MON** | 몬스터 생태계 & 보스 레이드 (Monsters & Bosses) | 10% | **100.0%** (5.0/5) | 10.00점 | 🟢 PASS |
| **D7_ITM** | 아이템, 코디 & 인챈트 (Itemization & Coordi) | 10% | **100.0%** (5.0/5) | 10.00점 | 🟢 PASS |
| **D8_UX** | 클래식 진입 흐름 & UX (Lobby & UI/UX) | 8% | **100.0%** (5.0/5) | 8.00점 | 🟢 PASS |
| **D9_SEC** | 데이터 영속성 & 무결성 (Zero-Loss Persistence) | 8% | **100.0%** (5.0/5) | 8.00점 | 🟢 PASS |
| **D10_AUT** | 지능형 자동사냥 & A* (Autonomous Hunt & Graph) | 8% | **100.0%** (5.0/5) | 8.00점 | 🟢 PASS |
| **TOTAL** | **종합 패리티 지수 (CMPI)** | **100%** | - | **100.00 / 100점** | **[S Tier]** |

---

## 2. 도메인별 50대 세부 지표 상세 검증 내역 (Detailed KPI Breakdown)

### D1_PHY: 물리 & 지형 토폴로지 (Physics & Foothold) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **PHY-01** | ✅ PASS | 1.0 | Foothold class and linear slope interpolation equation found in physics.js |
| **PHY-02** | ✅ PASS | 1.0 | 60Hz fixed timestep accumulator loop confirmed in physics.js |
| **PHY-03** | ✅ PASS | 1.0 | 100% match on canonical physics constants (GRAVITY=0.52, JUMP=-9.8, AIR=0.18, FRICTION=0.82) |
| **PHY-04** | ✅ PASS | 1.0 | Down-jump (↓+Jump) and one-way platform drop-through verified |
| **PHY-05** | ✅ PASS | 1.0 | Ladder center snap (±14px) and climbing state physics verified |
| **PHY-06** | ✅ PASS | 1.0 | Ladder top ledge clamber snap verified (no hovering at ladder ends) |
| **PHY-07** | ✅ PASS | 1.0 | Ladder jump escape and 0.25s re-attachment cooldown confirmed |
| **PHY-08** | ✅ PASS | 1.0 | Wizard Jump-Teleport (점텔) aerial momentum and snap landing verified |

### D2_ART: 2등신 페이퍼돌 & 비주얼 아트 (Art & Paperdoll) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **ART-01** | ✅ PASS | 1.0 | 2-Head Chibi SD body-to-head proportion verified in PlayerRenderer |
| **ART-02** | ✅ PASS | 1.0 | Layered paperdoll verified with 5 separate visual layers (body, head, face, arm, weapon) |
| **ART-03** | ✅ PASS | 1.0 | 1.5~2px dark outline enforcement verified across sprites and assets |
| **ART-04** | ✅ PASS | 1.0 | 2-step cel-shading with tone separation verified |
| **ART-05** | ✅ PASS | 1.0 | Classic face expression with double reflection highlight & pink blush verified |
| **ART-06** | ✅ PASS | 1.0 | Math.sin idle breathing bounce and walking forward body tilt verified |
| **ART-07** | ✅ PASS | 1.0 | 3-layer depth parallax scrolling (far: 0.1, mid: 0.4, near: 1.0) verified |
| **ART-08** | ✅ PASS | 1.0 | Offscreen canvas rasterization (Bake & Blit) optimization verified |

### D3_CBT: 전투 타격감 & 투사체 주스 (Combat & Juice) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **CBT-01** | ✅ PASS | 1.0 | DamageDigit staggered per-digit delay (0.04s) and arc trajectory verified |
| **CBT-02** | ✅ PASS | 1.0 | Canonical orange/yellow gradient damage skin with critical magnification verified |
| **CBT-03** | ✅ PASS | 1.0 | 0.08s Monster hitstop impact freeze verified |
| **CBT-04** | ✅ PASS | 1.0 | White silhouette mask offscreen hit flash (0.12s) verified |
| **CBT-05** | ✅ PASS | 1.0 | Parabolic knockback trajectory and damage threshold verified |
| **CBT-06** | ✅ PASS | 1.0 | Player contact damage, 1.2s i-Frame, and opacity blinking verified |
| **CBT-07** | ✅ PASS | 1.0 | Shuriken & arrow 3~5 step motion trail buffer with glow verified |
| **CBT-08** | ✅ PASS | 1.0 | Impact dust particles on landing and direction turn skid verified |

### D4_CLS: 직업 체계 & 스킬 완성도 (Classes & Skills) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **CLS-01** | ✅ PASS | 1.0 | Beginner and all 4 first-job classes implemented (초보자, 전사, 마법사, 궁수, 도적) |
| **CLS-02** | ✅ PASS | 1.0 | Canonical job specialization hierarchy verified (found: 파이터, 위자드, 헌터, 어쌔신, 크루세이더, 히어로, 나이트로드, 보우마스터) |
| **CLS-03** | ✅ PASS | 1.0 | Warrior skills complete (6/6: power_strike, slash_blast, iron_body, rage, combo_attack, brandish) |
| **CLS-04** | ✅ PASS | 1.0 | Magician skills complete (8/8: energy_bolt, magic_claw, teleport, magic_guard, thunderbolt, heal, holy_symbol, genesis) |
| **CLS-05** | ✅ PASS | 1.0 | Bowman skills complete (7/7: arrow_blow, double_shot, focus, soul_arrow, arrow_bomb, strafe, hurricane) |
| **CLS-06** | ✅ PASS | 1.0 | Thief skills complete (7/7: lucky_seven, double_stab, savage_blow, haste, dark_site, shadow_partner, avenger) |
| **CLS-07** | ✅ PASS | 1.0 | Permanent passive buff standard verified (no recurring buff timer expiration) |
| **CLS-08** | ✅ PASS | 1.0 | Projectile launch offset and proper rendering Z-Index sequence verified |

### D5_WLD: 월드 구성 & 맵 토폴로지 (World & Infrastructure) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **WLD-01** | ✅ PASS | 1.0 | Victoria Island towns complete (4 towns found: henesys, ellinia, perion, kerning) |
| **WLD-02** | ✅ PASS | 1.0 | Classic hunting grounds & boss lairs complete (7 areas found) |
| **WLD-03** | ✅ PASS | 1.0 | Portal graph topology fully mapped across 12 destination maps (perion_boar, henesys_town, ludi_clocktower, sleepy_dungeon, ship_orbis, ellinia) |
| **WLD-04** | ✅ PASS | 1.0 | Classic BGM system and canonical SFX audio triggers verified |
| **WLD-05** | ✅ PASS | 1.0 | Minimap HUD rendering with real-time player/portal blips verified |

### D6_MON: 몬스터 생태계 & 보스 레이드 (Monsters & Bosses) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **MON-01** | ✅ PASS | 1.0 | Canonical monster ecosystem verified (7 archetypes found: snail, slime, mushroom, pig, boar, zombie, wraith) |
| **MON-02** | ✅ PASS | 1.0 | Multi-part Zakum raid (Body + 8 independent arms with individual hitboxes) verified |
| **MON-03** | ✅ PASS | 1.0 | Field boss ecosystem verified (Mushmom jump quake pattern & trophies) |
| **MON-04** | ✅ PASS | 1.0 | WZ drop table parser, mesos, and quest item drops verified |
| **MON-05** | ✅ PASS | 1.0 | Platform-bound patrol AI, player aggro, and collision logic verified |

### D7_ITM: 아이템, 코디 & 인챈트 (Itemization & Coordi) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **ITM-01** | ✅ PASS | 1.0 | 5 classic inventory tabs (Equip, Use, Etc, Setup, Cash) fully isolated |
| **ITM-02** | ✅ PASS | 1.0 | Unique item UUID tracking and canonical equipment stat rolling verified |
| **ITM-03** | ✅ PASS | 1.0 | Classic 7-slot scroll enchanting with success/destruction odds verified |
| **ITM-04** | ✅ PASS | 1.0 | 100% decoupled stat-vs-cosmetic Coordi system with paperdoll mirroring verified |
| **ITM-05** | ✅ PASS | 1.0 | Town merchant shop buying/selling and meso balance verified |

### D8_UX: 클래식 진입 흐름 & UX (Lobby & UI/UX) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **UX-01** | ✅ PASS | 1.0 | Canonical entry flow: Title -> Auth -> Multi-char Lobby -> Dice -> Ingame verified |
| **UX-02** | ✅ PASS | 1.0 | Classic 4/4 starting stat dice roll (sum 25 random distribution) verified |
| **UX-03** | ✅ PASS | 1.0 | Classic HUD with HP/MP/EXP gauges, level badges, and quickslots verified |
| **UX-04** | ✅ PASS | 1.0 | Customizable KeyConfig modal for full keyboard remapping verified |
| **UX-05** | ✅ PASS | 1.0 | Social Fame (인기도) up/down system with cooldowns verified |

### D9_SEC: 데이터 영속성 & 무결성 (Zero-Loss Persistence) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **SEC-01** | ✅ PASS | 1.0 | SQLite WAL journaling confirmed (Code: True, Live DB: True) |
| **SEC-02** | ✅ PASS | 1.0 | Tier 1 zero-delay immediate persistence on levelup/stat/inventory verified |
| **SEC-03** | ✅ PASS | 1.0 | Server graceful shutdown signal handler with session flush verified |
| **SEC-04** | ✅ PASS | 1.0 | beforeunload navigator.sendBeacon client flush guard verified |
| **SEC-05** | ✅ PASS | 1.0 | Safe portal respawn and initial 3.0s i-Frame guard verified |

### D10_AUT: 지능형 자동사냥 & A* (Autonomous Hunt & Graph) (도메인 점수: 100.0%)

| KPI 코드 | 판정 | 점수 | 검증 결과 및 증거 (Evidence) |
|:---|:---:|:---:|:---|
| **AUT-01** | ✅ PASS | 1.0 | Foothold-ladder topological graph builder verified |
| **AUT-02** | ✅ PASS | 1.0 | Dynamic graph invalidation and rebuild on map transition verified |
| **AUT-03** | ✅ PASS | 1.0 | A* heuristic shortest path algorithm across footholds and ladders verified |
| **AUT-04** | ✅ PASS | 1.0 | Execution of deterministic action queue (Move, Climb, Drop) verified |
| **AUT-05** | ✅ PASS | 1.0 | Anti-Stuck displacement monitor (0.5s / 10px stationary escape jump) verified |

---

## 3. 결손 분석 및 개선 로드맵 (Gap Analysis & Recommendations)

🎉 **모든 50대 클래식 패리티 지표가 100% PASS 판정을 받았습니다! 결손 항목이 없습니다.**

---

*본 보고서는 OpenMaple Classic Parity Auditor 에이전트에 의해 자동 측정 및 생성되었습니다.*