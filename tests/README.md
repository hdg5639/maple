# 🧪 OpenMaple 테스트 스위트 (Tests Suite)

OpenMaple의 모든 자동화 테스트 및 회귀 방어 스위트를 도메인별로 분할 관리합니다.

---

## 📁 디렉토리 구조

- **`e2e/`**: 브라우저 E2E 사용자 인터랙션, CDP 헤드리스 통합 QA (`run_qa.py` 연동)
- **`physics/`**: 60Hz 물리 누적기, 선분 발판 흡착, 사다리/밧줄, 넉백 및 이동 제어 회귀 테스트
- **`combat/`**: 전투 충돌, 원거리 투사체/표창, 스킬 상태, 자쿰 및 다중 보스 수명주기 테스트
- **`unit/`**: 스탯 계산, 버프 생애주기, RPG 성장, 인벤토리 파티셔닝 단위 테스트

## 🚀 실행 방법

- **전체 E2E 무결점 QA (권장)**:
  ```bash
  python run_qa.py
  ```
- **개별 테스트 실행**:
  ```bash
  python tests/physics/test_movement.py
  node tests/combat/test_boss_lifecycle.js
  ```
