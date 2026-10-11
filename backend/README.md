# 여행 관리 서버

허용 이메일/비밀번호 로그인은 Better Auth, 공유 데이터는 D1에서 처리한다. ChatGPT 계정 없이 사용할 수 있다. 설정/초대/배포/여행 보호 규칙은 저장소 루트의 `docs/HANDOFF_FOR_CLAUDE.md`를 따른다.

루트에서 `npm ci`, `npm run build`, `npm test`를 실행한다. 이 폴더를 Sites 소스 저장소에 반영할 때는 생성된 `src/planner.html`과 package-lock.json도 포함하고 `npm ci`, `npm run build`, `npm test`를 실행한다. 배포 산출물은 `.openai/hosting.json`과 `dist/server/index.js`뿐이다. `tests/` 개발 서버는 배포하지 않는다.

런타임 키: SITE_ORIGIN, BETTER_AUTH_SECRET, LOGIN_ALLOWED_EMAILS, LOGIN_INVITES_JSON. DB 바인딩은 `DB`. 비밀값은 Sites 환경에만 설정한다. 여행 테이블은 planner_state, 인증 테이블은 pq_auth_*이며 임의 삭제/초기화하지 않는다.
