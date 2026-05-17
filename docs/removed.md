# 삭제/수정 기록

이 파일은 프로젝트에서 삭제되거나 크게 수정된 코드/파일의 이유를 기록합니다.

---

### [2026-05-17] harness_framework/ 디렉토리 삭제
- **파일**: `harness_framework/` (전체 디렉토리)
- **이유**: git clone으로 가져온 외부 프레임워크. 앱 개발용 워크플로우 도구로, 데이터 사이언스 프로젝트에는 불필요.
- **유지한 것**: docs 템플릿(PRD, ARCHITECTURE, ADR), 커맨드(harness.md, review.md), execute.py를 프로젝트에 맞게 적용 후 원본 삭제.

### [2026-05-17] docs/UI_GUIDE.md 미포함
- **파일**: harness_framework의 `docs/UI_GUIDE.md`
- **이유**: UI 디자인 가이드는 데이터 사이언스 프로젝트에 불필요하여 복사하지 않음.

### [2026-05-17] src/data_collection.py 로깅 경로 수정
- **변경**: `logging.FileHandler("logs/data_collection.log")` → `logging.FileHandler(LOGS_DIR / "data_collection.log")`
- **이유**: 상대 경로가 실행 디렉토리 기준이라 `src/` 에서 실행 시 `src/logs/` 를 찾아 FileNotFoundError 발생. PROJECT_ROOT 기준 절대 경로로 변경.
