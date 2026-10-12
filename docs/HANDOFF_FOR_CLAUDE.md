# Claude Code 인수인계 — 2026-10-11

## 최신 디자인 · 2026-10-13 (화이트 톤 재디자인)

아래의 어두운 녹색·ui.css·Galmuri 설명은 폐기됐다. 현재 기준은 [DESIGN_2026-10-13.md](DESIGN_2026-10-13.md)다. 화이트 톤 + Tailwind v4 + 실제 장소 사진 + 예약별 비용 기록(기기 로컬 저장). 모바일 구조(하단 탐색 5개, 지도/일정 분리, 고정 날짜, URL 복원)는 그대로 유지한다.

## 모바일 UX · 2026-10-13

아래 초기 디자인 설명보다 이 지침을 우선한다. 어두운 배경과 작은 픽셀 아이콘을 유지하되, 999px 이하에서는 하단 지도·일정·예약·체크·더보기의 단일 탐색을 쓴다. 지도와 시간표는 분리하고 공통 날짜 탭을 상단에 고정한다. URL의 day/view, 뒤로 가기, 열린 체크 상세와 초점을 유지한다. 관리 패널은 접을 수 있지만 편집·미저장·오류 상태에서 펼쳐진다. 더보기의 관리 버튼은 패널로 초점을 이동한다. 공유 저장·초대 이메일 인증·서버 상태는 기존 정책을 따른다. 예약과 여행 원본은 바꾸지 않았다. 상세 근거·실측·검증 한계는 [MOBILE_UX_REVIEW.md](MOBILE_UX_REVIEW.md)를 읽는다.

## 사용자 요청과 현재 구조

푸꾸옥 커플 여행(2026-11-03~11-09, 5박 7일)을 관리한다. 확정 예약/일정은 유지하고 미정만 조사·제안한다. 가로로 넓은 퀘스트 행, 둥근 모서리, 민트 격자와 분홍 픽셀 창, 실제 지도와 Google 길찾기를 유지한다.

공개 주소: https://toviworktest.github.io/phuquoc-pocket-trip/

원격 저장소: https://github.com/toviworktest/phuquoc-pocket-trip (main)

관리 서버: https://phuquoc-pocket-trip-2026.tovi.chatgpt.site

로그인: `/login`. **ChatGPT 계정이 아니라 허용된 이메일 + 이 앱 전용 비밀번호**를 사용한다. 이메일 주소를 로그인 식별자로 쓰며 네이버 OAuth나 이메일 인증 메일 발송은 구현하지 않았다. 사이트 운영/배포용 Sites 계정과 여행자 로그인은 별개다.

바탕화면 `푸꾸옥 여행 2026/github/`가 새 관리 원본이다. 기존 예약 증빙과 원본 인수인계는 부모 폴더 `private/`, `docs/인수인계_원본.md`에 보존한다. GitHub 저장소에는 비공개 자료를 복사하지 않는다.

## 확정 여행 기준

- 제주항공 11/3 18:00 ICN → 22:15 PQC, 11/8 23:15 PQC → 11/9 06:35 ICN. 출발·도착 각 현지시간.
- Vinpearl Resort & Spa 11/3~11/5 2박, Noska Hotel Sunset Town 11/5~11/8 3박.
- 11/4 Safari → VinWonders/Sea Shell → Vinpearl 수영장/해변 → Grand World. Typhoon World 제외.
- 11/6 혼똔/Aquatopia, 11/7 남부 3섬 호핑, 11/8 중부 쇼핑·마사지·샤워·공항. 호핑 후 중부 방문 추가 금지.
- YUJU SPA 2인 예약 확정, 총 1,500,000 VND, 팁 의무 없음, 동시 관리·짐 보관·샤워·헤어드라이어 가능. 날짜/시각/코스는 사진에 없어 미확인. `d6-spa`(11/8)에 임시 표시하며 확정 시각으로 오해시키지 않는다. 샌딩은 리셉션에서 요청, 차량 배차 상황에 따름.
- 예약금/송금 상세와 예약번호·이름은 부모 `private/`에만 있다. 공개 문서에 옮기지 않는다.

## 파일과 빌드

| 파일 | 역할 |
|---|---|
| data.js | 잠금된 여행 기준/백업 호환 기준. 임의 변경 금지 |
| bookings.js | 후속 예약 근거의 공개 요약/체크리스트 갱신 |
| app.js, index.html | 일정/메모/예약/준비물 UI |
| app.css | Tailwind v4 원본 · 화이트 테마 (build.mjs가 컴파일해 인라인) |
| photos.js, assets/photos/ | 장소 사진 WebP + 출처·라이선스 (빌드 시 data URL로 인라인) |
| geometry.js, geography.js, map-board.js | 검증 좌표, 실제 OSM 해안선, 지도 표시 |
| build.mjs | 원본을 단일 오프라인 HTML과 publish/로 생성 |
| scripts/build-web.mjs | 오프라인 원본 → 관리 Worker + GitHub 보기 화면 생성 |
| backend/src/auth.mjs | Better Auth, 초대 검증, 서버 세션/이메일 허용 목록 |
| backend/src/worker.js | 익명 읽기/인증 저장/원본 보호/충돌 검증 |
| backend/src/cloud.js | 로그인 상태, 명시적 공유 저장, 갱신/충돌 UI |
| backend/src/login.html | 이메일 로그인/첫 비밀번호 설정/변경 |
| pages.config.json | 공개 URL와 관리 서버 origin. 비밀값 없음 |

`npm ci; npm run build; npm test` (각 명령 순서대로). Node 24 이상. Better Auth 1.7.7, esbuild 0.28.2를 lockfile로 고정했다. `npm run preview`는 4178에서 공개 보기 전용 화면을 연다. `node backend/tests/dev-server.mjs`는 4176에서 실제 인증을 이용하는 메모리 DB 테스트 서버를 연다. 개발 서버를 배포하지 않는다.

지도는 EPSG:3857, 실제 OSM 해안선과 확인된 Google 장소 좌표를 사용한다. 2026-09-30 검증 기준이다. `geometry.js.routes`는 아직 비어 있다. 선을 그럴듯하게 추가하지 말고 실제 도로/도보 계산 결과만 사용한다. 업체/지점 미정은 지도 밖에 표시한다. 공개 정보와 실제 11월 운영 조건은 구별한다.

## 인증과 데이터

Sites project_id: `appgprj_6abc9bc475d88191838ba77a78e833ac`. `.openai/hosting.json`의 기존 프로젝트를 재사용한다. audience는 public.

서버 환경 변수:

- `SITE_ORIGIN`: 위 관리 서버의 정확한 HTTPS origin.
- `BETTER_AUTH_SECRET`: 서버 비밀키. 회전하면 기존 세션에 영향. 임의 재생성 금지.
- `LOGIN_ALLOWED_EMAILS`: 승인한 이메일 목록, 쉼표 구분, 비밀값.
- `LOGIN_INVITES_JSON`: `{email, tokenHash, expiresAt}` 배열, 비밀값. 원문 초대 토큰을 서버 환경에 넣지 않는다.
- 과거 `EDITOR_EMAILS`는 현재 인증 코드에서 사용하지 않는다. 구형 ChatGPT 인증 헤더는 관리 권한을 주지 않는다.

Better Auth의 scrypt 비밀번호 해시, HttpOnly/Secure 세션 쿠키, 7일 세션, DB rate limit을 사용한다. 가입은 허용 이메일 + 유효한 초대 토큰을 서버 DB 생성 hook에서 확인한다. 초대는 7일 유효하고 등록된 이메일은 다시 가입할 수 없다. 이메일의 소유를 메일로 검증한 것은 아니며, 소유자가 개인 전달한 초대 링크가 최초 가입 권한이다. 승인 이메일 삭제는 저장 권한을 즉시 제거한다.

추가 관리자: 사용자에게 정확한 이메일을 받은 뒤 `scripts/create-invite.mjs --email <승인주소> --origin <관리origin> --out <공개저장소밖의 private 새폴더>`를 실행한다. `LOGIN_ALLOWED_EMAILS`와 `LOGIN_INVITES_JSON`에 **기존 항목을 보존하며** 추가하고 Sites 재배포한다. 생성된 HTML 초대장은 개인 전달용이다. 공개 링크와 혼동하지 않는다. 비밀번호는 사용자가 직접 설정한다. 자동 이메일 발송/셀프서비스 비밀번호 재설정은 미구현이며 분실 시 관리자 지원이 필요하다. 일반 로그인 상태에서는 비밀번호 변경 가능.

D1 `DB`의 `planner_state` id=1이 여행 공유 상태 원본이다. `pq_auth_*` 테이블은 인증 전용이며 첫 인증 요청에 라이브러리 migration으로 생성한다. 기존 planner_state를 건드리지 않는다. GET `/api/state`만 익명 CORS `*`. PUT은 같은 origin의 유효 세션, 허용 이메일, JSON, X-Planner-Write=1, 숫자 버전/유효한 상태가 필요하다. 오래된 버전은 409로 거절한다. 서버 허용 목록이 브라우저 코드에 들어가면 안 된다.

메모/추가 일정/체크는 **공유 저장**을 눌러야 공개 반영한다. 오프라인 localStorage를 자동 업로드하지 않는다. JSON schema와 잠금 예약 기준을 유지한다. 공유 DB 초기화 금지.

## 배포

GitHub: main push → GitHub Actions 빌드/테스트 → `public-site/`만 Pages 게시. Actions에 인증 비밀값은 필요 없다. 로그인 서버는 GitHub Pages에서 실행될 수 없어 Sites에서 유지한다. 공개 페이지는 이 서버의 공개 읽기 API를 사용하고 ‘로그인하고 관리’가 서버의 `/login`으로 이동한다.

Sites: `backend/`의 소스/lockfile와 빌드 출력을 기존 Sites Git checkout에 반영한다. `src/planner.html`은 루트 빌드 결과로 자동 생성된다. Sites에서 `npm ci`, `npm run build`, `npm test` 후 공식 source workflow로 commit/push/pack한다. 동일 커밋의 `.openai/hosting.json` + `dist/server/index.js`만 tar로 묶어 save_site_version → deploy_site_version. 소스 저장소 토큰은 일시적 stdin 전달만 허용한다. Windows GNU tar는 `TAR_OPTIONS=--force-local`, 해당 프로세스 PATH에 Git/bin이 필요하다. 코드 수정 후 두 호스트가 동일한 여행 원본을 사용하도록 각각 배포한다.

Claude 환경에 Sites 커넥터가 없다면 GitHub Pages 업데이트는 가능하지만 관리 서버 배포는 Sites가 연결된 Codex에서 진행해야 한다. 별도 호스팅 이전을 완료했다고 주장하지 않는다. 자체 서버로 이전하려면 D1 여행 상태/인증 DB와 비밀값의 안전한 이전이 선행되어야 한다.

## 검증과 남은 확인

- 새 인증을 실제 라이브러리/SQLite 어댑터로 테스트: 정상 초대/로그인/로그아웃/비밀번호 변경, 허용 목록 제외, 초대 없는 가입·만료·다른 이메일 거절, 시도 횟수 제한, 변조 헤더 무시.
- 상태 API: 익명 401, 권한/Origin 403, 형식 415, 크기 413, 잠금 항공 변경 400, 오래된 버전 409. 저장 이후 익명 읽기 검증.
- 실제 서버 `/api/auth/ok`, `/api/session`, `/login` 200. 배포 전후 공유 상태 JSON hash 동일, version 0 보존.
- 사용자의 실제 비밀번호 설정/실제 관리자 저장은 사용자가 개인 초대장을 열어 진행해야 한다. 모델이 대신 비밀번호를 만들지 않았다.
- 초기 이메일 로그인 배포: Sites v6, commit `7f440351505b07faa8e62059d1d9d738f495aa9c`, environment revision 2. 후속 릴리스는 배포 기록과 저장소 이력 확인.
- 실제 여행 날짜의 업체 영업/픽업/스파 시각/샌딩 확정과 지도 도로 geometry 연결은 계속 확인할 미정 항목이다.


## 2026-10-12 티켓 예약 확정 업데이트

사용자 예약내역에서 11/4 사파리+빈원더스 성인 2명, 11/6 혼똔 왕복 케이블카+런치 뷔페 성인 2명, 11/6 키스 오브 더 씨(신장 100cm 이상) 2명 예약 확정을 확인했다. bookings.js.activities와 eventUpdates로 예약 화면/일정/체크리스트/준비물에 반영했다. 기존 data.js, 순서, 계획 시간대, 개인 오버라이드/메모/체크는 유지한다. Aquatopia 입장 포함 여부, 뷔페 장소·시간, 공연 시각·좌석·불꽃놀이 포함 여부는 바우처 확인 대기다. 결제금액과 원본 이미지는 바탕화면 프로젝트의 private/에 보존한다.

## 2026-10-12 전체 디자인과 출발 준비 업데이트 (디자인은 아래 후속 지침 우선)

GitHub Pages가 메인 사이트다. 밝은 바탕, 초록 포인트, 읽기 쉬운 일반 글꼴, 상단 탐색, 둥근 목록으로 화면 전체를 정리했다. ui.css의 옛 픽셀 창/격자 스타일을 교체했으며 작은 픽셀 아이콘은 남긴다. 예약의 상세 안내는 기본 접힘으로 바꾸되 내용은 모두 유지했다. 로그인 화면도 같은 톤이다.

data.js의 checklist에 출발 준비 8개(입국신고, 선택 패스트패스, 스마트패스, 온라인 면세점, eSIM, 100달러 중심 환전, 동 지갑, Grab), 기념품 3개(후추, 망고스틴 젤리, 코코넛 커피)를 추가했다. 기존 13개 ID와 완료 상태, 날짜·항공·숙소·핵심 방문 순서·저장 schema·잠금 기준은 유지한다. 추가 항목을 포함한 검사기는 GitHub와 Sites에서 동일해야 한다. 상태 DB를 초기화하지 않는다.

공식 링크와 접히는 팁은 체크박스 label 바깥에 있어 링크를 눌러도 완료 표시가 바뀌지 않는다. 출발 준비·기념품·예약/현지 확인의 3개 구역으로 나눴다. [CHECKLIST_SOURCES.md](CHECKLIST_SOURCES.md)에 출처와 확인 범위를 정리했다. 입국신고는 공식 안내의 ‘도착 전 3일 이내 작성 권장’으로 적었으며 강제적인 72시간 전 마감으로 쓰지 않는다. 실제 제출·가입·구매는 사용자가 진행한다.

## 2026-10-12 후속: 어두운 배경과 가독성

사용자 최신 요청에 따라 밝은 UI를 밤의 섬 느낌으로 조정했다. `ui.css`의 색 토큰은 배경 #101e1c, 카드 #1a2b28, 강조 표면 #223a33, 제목 #f4f8f5, 본문 #d4dfd9, 보조 #abbdb3이다. 민트는 확정과 주요 동작, 하늘색은 예정/예약 날짜, 호박색은 시간과 확인 필요를 구분한다. 체크리스트 분류는 출발 준비 민트 / 기념품 분홍 / 예약·현지 확인 하늘색이다. 색과 함께 텍스트 라벨·굵기를 유지한다.

모바일의 작은 시각/상태/보조 글자 크기를 올렸다. 로그인·입력·모달·지도 검증 상세도 같은 톤을 사용하며 지도 원래 색과 좌표는 유지한다. 인쇄에서는 밝은 색 토큰으로 전환한다. 일정·예약·체크리스트 내용·앱 동작·인증·서버 상태는 변경하지 않았다.

디자인 참고: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md . 개별 스킬 평점은 확인되지 않았으며 공식 디자인 지침과 실제 DOM의 글자 대비 점검을 기준으로 적용했다. 새로운 패키지나 외부 스킬 실행 코드는 설치하지 않았다. 가독성 기준: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html . 일반 글자 대비 4.5:1 이상을 목표로 모바일과 데스크톱, 펼친 상세/관리 창을 점검한다.
