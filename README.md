# 우리의 푸꾸옥 · 포켓트립

화이트 톤의 모던한 모바일 여행 플래너입니다(Tailwind CSS v4). 날짜·일정·예약마다 실제 장소 사진을 보여주고, 예약·비용 탭에서 확정 예약에 쓴 금액을 기록할 수 있습니다(이 기기에만 저장). 상단 실제 지형 지도, 날짜별 시간표, Google 길찾기, 예약 요약을 제공합니다.

휴대폰에서는 하단의 지도·일정·예약·체크·더보기로 이동합니다. 지도와 시간표를 따로 열고 상단 날짜로 바꿀 수 있으며, 체크리스트의 요약을 누르면 상세 팁과 링크가 펼쳐집니다. [모바일 UX 검토와 개선 기록](docs/MOBILE_UX_REVIEW.md)

- [여행 페이지](https://toviworktest.github.io/phuquoc-pocket-trip/) — 로그인 없이 열람
- [이메일 로그인 · 관리](https://phuquoc-pocket-trip-2026.tovi.chatgpt.site/login) — 초대받은 이메일과 플래너 전용 비밀번호로 편집

GitHub Pages는 공개 화면을 배포합니다. 공유 데이터와 이메일 로그인은 기존 Sites의 Worker/D1에서 처리합니다. 여행자는 ChatGPT 계정이 필요 없습니다. 공유 메모는 공개이므로 예약번호·여권·결제정보를 입력하지 마세요.

## 개발

Node.js 24 이상에서 실행합니다.

```sh
npm ci
npm run build
npm test
npm run preview
```

`http://127.0.0.1:4178`에서 공개 화면을 확인합니다. `npm run preview`는 실제 서버의 공유 내용을 읽는 보기 전용 화면입니다. 로컬 로그인·편집 테스트는 `node backend/tests/dev-server.mjs`를 실행하고 `http://localhost:4176`으로 접속합니다. 실제 데이터와 분리된 메모리 DB를 사용합니다.

`main`에 push하면 `.github/workflows/pages.yml`이 빌드·테스트 후 **public-site/**만 GitHub Pages에 배포합니다. 로그인 서버 변경은 Sites 별도 배포가 필요합니다. 자세한 운영 방법과 인수인계는 [docs/HANDOFF_FOR_CLAUDE.md](docs/HANDOFF_FOR_CLAUDE.md)를 읽어 주세요.

확정 항공·숙소·기본 방문 순서는 보호합니다. YUJU SPA 예약은 반영되었으며, 사진에 없는 이용 날짜·시각·코스는 확인 대기입니다.

## 공개 범위

원본 예약 사진, 결제정보, 로그인 이메일 목록, 비밀번호, 초대 링크, 서버 비밀값은 이 저장소에 포함하지 않습니다. `.gitignore`만 믿고 프로젝트 전체를 올리지 말고 `git diff --cached`를 확인하세요. 검색 제외 메타 태그는 접근 제한 기능이 아닙니다.

지도: OpenStreetMap 지형/Google 공개 장소 핀, Leaflet 1.9.4. 장소 사진: Wikimedia Commons(작가·라이선스는 photos.js와 백업 탭에 표기). 글꼴: 기기 기본 글꼴. 출처·라이선스는 소스와 `assets/`, `vendor/`에 보관합니다.

2026-10-12: 사파리+빈원더스(11/4), 혼똔 왕복 케이블카+런치 뷔페 및 Kiss of the Sea 공연(11/6) 각 2인 예약 확정 반영. 구체 이용 시각과 Aquatopia 포함 여부는 확인 대기입니다.
