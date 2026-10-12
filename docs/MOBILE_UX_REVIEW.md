# 모바일 UX 재검토 · 2026-10-13

사용자가 자주 보는 휴대폰을 우선했다. 기존 여행 내용·예약·지도 좌표·저장 상태는 유지한다.

## 참고 기준

스킬의 평점이나 품질 순위는 검증되지 않았다. 공개 설치 수가 많은 아래 지침을 선택하고 실제 화면에서 필요한 항목을 적용했다. 설치 수는 평가 점수가 아니다. 외부 스킬 실행 파일이나 새 패키지는 설치하지 않았다.

- [Vercel web-design-guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md): 의미 있는 HTML, 초점 이동, URL 상태, 작은 화면, 안전 영역. [검사 규칙](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md): 접근성 우선, 주요 터치 영역 44px 이상, 하단 탐색 5개 이내, 필요한 정보를 펼쳐 보기.
- [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md): 기존 어두운 섬 테마와 작은 픽셀 아이콘의 일관성.
- 설치 규모: [frontend-design](https://skills.sh/anthropics/skills/frontend-design), [web-design-guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines), [UI UX Pro Max](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max).

## 비판적으로 확인한 문제와 변경

| 기존 문제 | 반영한 개선 |
|---|---|
| 휴대폰 상단·하단 메뉴 중복, 지도와 일정 동시 선택 | 999px 이하에서 하단 메뉴 5개로 통일하고 하나만 활성화 |
| 시간표를 보기 위해 긴 지도를 지나야 함 | 지도와 시간표를 분리하고 날짜 선택을 공통 제공 |
| 선택 날짜가 스크롤 속에 묻힘 | 날짜 탭 상단 고정, 선택한 날짜가 가로 영역 안에 보이도록 조정 |
| 새로고침·뒤로 가기에서 날짜와 탭 맥락 손실 | day/view URL 상태 저장·복원, 기존 쿼리와 앵커 보존 |
| 일정 상세 왼쪽 빈 공간과 작은 버튼 | 상세를 카드 전체 너비로 사용, 주요 버튼·지도 확대·이전/다음은 44px 이상 |
| 체크리스트 설명이 늘 펼쳐져 긴 화면 | 제목·짧은 요약 우선, 상세·공식 링크 펼침, 긴급/마감 표시 유지 |
| 체크 후 열린 상세와 키보드 초점 손실 | 다시 그려도 열린 상세와 체크박스 초점 유지 |
| 관리 패널이 첫 화면을 차지 | 기본 접힘. 편집 가능·미저장·오류 상태에서는 자동 펼침 |
| 후보 목록과 관리 기능을 찾기 어려움 | 더보기에 관리·후보·백업 배치. 관리 열기 시 초점 이동 |

## 실측과 확인

Chrome 390×844 CSS px, 같은 첫날/체크리스트 기준. 지도·시간표 위치는 문서 상단에서 잰 값이며 탭 이동 후에는 제목과 날짜가 화면 상단으로 이동한다.

| 항목 | 변경 전 | 변경 후 |
|---|---:|---:|
| 지도 시작 | 508px | 332px |
| 시간표 시작 | 1,675px | 443px |
| 첫 일정 카드 높이 | 126px | 108px |
| 체크리스트 24개 전체 높이 | 3,744px | 2,887px |
| 하단 선택 표시 | 2개 | 1개 |

- 320px 세로, 390px 세로, 844px 가로 화면에서 가로 넘침 없음. 가로 화면에도 단일 탐색과 지도/일정 분리 적용.
- 첫 지도 화면의 일반 UI 글자 대비 검사에서 최소 6.18:1, 점검한 글자 중 4.5:1 미달 없음. 지도는 원래 색/좌표를 유지하며 지도 안 라벨은 별도 범위.
- 날짜 선택 → 예약 → 뒤로 가기에서 날짜/일정 복원 확인. 새로고침 및 체크 상세 열기 확인.
- 분리된 메모리 DB 계정으로 로그인 → 체크 → 관리 열기 → 공유 저장 → 새로고침 후 체크 유지 확인. 운영 데이터에는 테스트 내용을 쓰지 않음.
- `npm run build`, `npm test` 10개 통과. 인증/승인 이메일/고정 예약/버전 충돌/공개 비밀정보 제외 검사 포함.
- 실제 iPhone Safari/Android 기기의 터치·노치·키보드는 확인하지 못했다. 브라우저 크기 검증이며 모든 기기의 완전한 접근성 인증을 의미하지 않는다.

모바일 구조를 다시 지도+시간표가 이어지는 긴 화면으로 되돌리지 않는다. PC는 지도와 시간표를 함께 보여준다. 기존 명시적 공유 저장 방식을 유지한다.
