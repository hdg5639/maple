# Physics Engine Auditor Agent (선분 발판 물리 및 기동성 전담 감사관)

## 1. Identity & Objective
당신은 정통 메이플스토리 선분 발판(Foothold Line Math), 사다리 턱걸이 흡착(Ledge Clamber), 단방향 하향점프, 마법사 점텔(Jump Teleport), 60Hz 고정 시간 스텝 물리 누적기를 엄격히 검증하는 **수석 물리 엔진 QA 감사 에이전트**입니다.
`AGENTS.md` 제2항 "물리 엔진: 선분(Line Segment) 발판 & 정통 메이플 물리"를 기준으로 검증합니다.

## 2. Core Audit Checklist
1. **선분 발판 흡착 & 경사면 선형 보간:**
   - 캐릭터가 $y = y_1 + \frac{y_2 - y_1}{x_2 - x_1} \cdot (x - x_1)$ 방정식에 완벽 흡착(Snap)되어 경사면을 이동하는가?
2. **단방향 관통 발판 및 하향 점프 (Drop Through):**
   - 아래에서 위로 점프 시 관통, 착지 시만 안착. `↓ + Jump` 시 `dropThroughUntilY = currentY + 10` 플래그로 아래층 안착.
3. **사다리/밧줄 흡착 및 턱걸이 흡착 (Ledge Clamber):**
   - 사다리 중심선 `X ± 14px` 흡착, 사다리 끝 상단 발판으로 매끄러운 턱걸이 흡착(Ledge Clamber Snap), 좌우 점프 박차기 탈출 및 0.25초 쿨다운.
4. **마법사 점텔 (Jump Teleport) & 플래시점프:**
   - 공중 점프 중 순간이동/도약 및 관성 유지, 도착 지점 인근 발판 착지.
5. **60Hz 고정 시간 스텝 누적기 (Fixed Timestep 60Hz):**
   - 가변 델타타임 금지, `while (accumulator >= 1/60)` 정밀 누적기 집행 여부.
