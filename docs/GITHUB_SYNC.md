# GitHub로 공유 데이터 관리 · 2026-10-13

로그인 서버(Sites) 없이 GitHub만으로 메모·추가 일정·체크를 함께 관리한다.

## 동작

- 원본: 저장소의 `data/state.json` (기존 플래너 상태와 같은 schema). 2026-10-13 전환 시 Sites의 공유 상태는 version 0, 빈 상태였다.
- 보기: 누구나. 배포된 `state.json`을 읽는다. 로그인이 없고 GitHub API도 호출하지 않는다.
- 편집: 기기마다 GitHub fine-grained 토큰을 한 번 연결하면 체크·메모·일정 편집이 켜진다. "공유 저장"을 누르면 GitHub API로 `data/state.json`을 커밋한다. 커밋마다 Actions가 빌드·검증 후 배포해서 1–2분 뒤 모든 기기에 보인다. 편집 중인 기기는 GitHub에서 바로 최신 내용을 읽는다.
- 충돌: 저장할 때 파일 sha를 함께 보내서, 다른 기기가 먼저 저장했으면 덮어쓰지 않고 멈춘다.
- 검증: 앱이 저장 전에 validateState로 확인하고, 빌드(`scripts/build-web.mjs`)와 테스트에서도 같은 검증을 한다. 잘못된 파일이나 고정 항공시간 변경은 배포되지 않는다.
- 백업: Git 기록 전체가 백업이다. 저장소 → `data/state.json` → History에서 예전 내용을 보고 되돌릴 수 있다.
- 공개 범위: 저장소가 공개라서 공유 메모·체크도 공개다. 예약번호·여권·결제정보는 적지 않는다. 비용 기록은 기기 localStorage에만 저장하고 커밋하지 않는다.

## 토큰 만들기 (기기마다 한 번)

1. GitHub 로그인 → [새 fine-grained 토큰](https://github.com/settings/personal-access-tokens/new)
2. Token name: 예) `푸꾸옥 플래너 - 내 폰`
3. Expiration: 여행이 끝난 뒤 날짜로 설정 (예: 2026-11-30)
4. Repository access: **Only select repositories** → `toviworktest/phuquoc-pocket-trip`
5. Permissions → Repository permissions → **Contents: Read and write** (Metadata는 자동으로 읽기 전용)
6. Generate token → `github_pat_…` 값 복사
7. 여행 사이트 → 더보기 → 편집 연결 → 붙여 넣고 "연결"

여자친구분 폰도 같은 방법으로 **별도 토큰**을 하나 더 만들어 연결하면 된다(이름만 다르게). 개인 저장소에는 다른 계정의 fine-grained 토큰을 쓸 수 없어서 저장소 주인 계정으로 만든다. 커밋은 주인 계정 이름으로 기록된다.

토큰은 그 기기 브라우저(localStorage)에만 저장되고 api.github.com에만 보낸다. 폰을 잃어버리거나 노출이 의심되면 GitHub → Settings → Developer settings → Fine-grained tokens에서 해당 토큰을 Revoke한다. 사이트의 "이 기기 편집 해제"는 그 기기에서 토큰을 지운다.

## 개발 메모

- `github-sync.js`: 공개 사이트의 공유 클라이언트. 옛 `backend/src/cloud.js`와 같은 `PQ_CLOUD`/`PQ_APP` 인터페이스를 쓴다.
- `pages.config.json`의 `github`: owner/repo/branch/path.
- `backend/`(Sites Worker·이메일 로그인)는 빌드만 유지하는 보관용이다. 공개 페이지는 호출하지 않는다.
- 토큰을 모델이 대신 만들거나 파일·로그에 남기지 않는다. 편집 흐름 테스트는 GitHub API 모의로 한다(실제 `data/state.json`에 테스트 커밋 금지).
