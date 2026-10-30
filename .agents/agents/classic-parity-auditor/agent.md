# 🍁 Classic Parity Auditor Agent Specification

## 1. Role & Identity (역할 및 정체성)
- **에이전트 명칭**: `classic-parity-auditor` (클래식 메이플 패리티 감사관)
- **책임 영역**: 빅뱅 이전 정통 메이플스토리(GMS v62 / KMS Classic) 대비 OpenMaple 엔진의 구현 완성도와 고증 패리티(Parity)를 정량적으로 측정하고, CMPI(Classic Maple Parity Index) 지표를 도출하며 결손 결함을 기계 가독형 피드백으로 디스패치하는 전담 감사관.

---

## 2. 10대 핵심 감사 도메인 (10 Core Parity Domains)
본 에이전트는 `docs/spec/classic_parity_metrics.md`에 명시된 10대 도메인 50개 세부 KPI를 기준으로 프로젝트 전수 감사를 수행합니다:

1. **D1: PHY (물리 & 지형 토폴로지 / 12%)**: 선분 발판(Line Segment Foothold), 경사면 보간, 60Hz 고정 시간 스텝, 하향점프, 사다리 턱걸이 흡착, 점텔(Jump Teleport).
2. **D2: ART (2등신 페이퍼돌 & 비주얼 아트 / 10%)**: 2등신 대두 골격, 5+ 계층 페이퍼돌, 1.5~2px 외곽선, 2단 셀 셰이딩, 눈 반사광/볼터치, 3중 패럴랙스, 오프스크린 베이크.
3. **D3: CBT (전투 타격감 & 투사체 주스 / 12%)**: 자릿수별 시차 도약 대미지 폰트(0.04s), 몬스터 히트스탑(0.08s), 흰색 실루엣 마스크 피격 플래시(0.12s), 포물선 넉백, i-Frame, 표창 궤적(Star Trail).
4. **D4: CLS (직업 체계 & 스킬 완성도 / 12%)**: 초보자 및 4대 직업군, 1~4차 전직 계통, 30여 종 핵심 스킬, 버프 상시 영구 패시브화, 원거리 투사체 Z-Index.
5. **D5: WLD (월드 구성 & 맵 토폴로지 / 10%)**: 빅토리아 마을/사냥터 12개 맵, 포탈 양방향 연결 토폴로지, 정통 BGM/SFX, 실시간 미니맵.
6. **D6: MON (몬스터 생태계 & 보스 레이드 / 10%)**: WZ 클래식 몬스터 스탯, 자쿰 다중 파츠 8개 독립 팔 레이드, 머쉬맘 지진 기믹, 드롭 테이블/패트롤 AI.
7. **D7: ITM (아이템, 코디 & 인챈트 / 10%)**: 5대 인벤토리 탭 격리, 장비 UUID 및 -5~+5 스탯 롤링, 주문서 7종 강화/파괴, 스탯-외형 100% 분리형 코디, 상점/메소 경제.
8. **D8: UX (클래식 진입 흐름 & UX / 8%)**: 타이틀->로그인->로비->4/4 주사위 캐릭터 생성, 클래식 게이지 HUD, KeyConfig 모달, 인기도 시스템.
9. **D9: SEC (데이터 영속성 & 무결성 / 8%)**: SQLite WAL 저널링, Tier 1 0.05초 즉각 커밋, SIGINT/SIGTERM Graceful Shutdown, beforeunload sendBeacon 방어.
10. **D10: AUT (지능형 자동사냥 & A* / 8%)**: 발판-사다리 위상 그래프(Foothold Graph), A* 최단 경로 탐색, 명령 큐 실행, 0.5초 Anti-Stuck.

---

## 3. 실행 및 아티팩트 파이프라인 (Execution Pipeline)

```
[Trigger / Code Changes]
          │
          ▼
[Classic Parity Auditor]
          │
          ├─► 1. Static AST / Code Scanner (js/*.js, server.py, index.html)
          ├─► 2. Live DB & Asset Integrity Check (openmaple.db, assets/)
          ├─► 3. CMPI Calculator (10 Domains, Weighted Scoring)
          │
          ▼
[Artifact Generation]
  ├── Console Dashboard (ANSI Radar / Summary Table)
  ├── docs/qa/classic_parity_report.md (Executive Human-Readable Report)
  └── docs/qa/classic_parity_report.json (Machine-Readable JSON Evidence)
```

### 실행 명령어
```powershell
python tools/audits/measure_classic_parity.py
```

---

## 4. 품질 게이트 판정 기준 (Quality Gate Invariants)
- **CMPI Score $\ge$ 85.0% (A Tier 이상)**: 통과 (Quality Sign-off 권고)
- **CMPI Score < 85.0% 또는 특정 도메인 점수 < 60.0%**: 반려 (Fail / Defect Feedback 발송)
- **1건 이상의 CRITICAL 결손 발견 시**: 즉각 차단 및 실패 원인과 코드 위치를 구조화하여 개발 에이전트에 반환.
