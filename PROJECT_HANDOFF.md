# 프로젝트 인수인계 (다른 컴퓨터에서 이어서 작업하기)

> 이 문서는 **다른 컴퓨터에서 Claude Code로 이 프로젝트를 이어서 개발**하기 위한 요약입니다.
> 처음 세팅할 때 이 파일을 Claude Code에게 먼저 읽게 하면 맥락을 빠르게 파악합니다.

---

## 1. 프로젝트 개요

**드론 시뮬레이션 부스 예약 시스템** — 삼성중공업 생산AX/PI팀 내부용 예약 웹앱.

- 부스 2개(Booth A, Booth B)를 **화·수·목요일 13:00~17:00** 사이 **1시간 단위**로 예약
- 고객 화면: 날짜/부스/시간 선택 → 이름·연락처 입력 → 예약. 예약된 시간은 실시간으로 "예약 마감" 표시
- 관리자 화면(`#admin`): 비밀번호 입력 후 날짜별 예약 조회/취소 + "예약 현황 한눈에 보기" 요약
- **백엔드 서버 없음**: GitHub Pages(정적 호스팅) + Supabase(BaaS) 조합으로 운영

## 2. 기술 스택

- React 18 + Vite 5
- Tailwind CSS 3 (다크 "관제탑/레이더" 테마 — navy 배경 + amber/cyan 강조)
- `@supabase/supabase-js` — DB 조회/삽입/삭제 + Realtime 실시간 구독
- 상태관리 라이브러리 없음(React 기본 훅 + 커스텀 훅만 사용)
- 라우팅 라이브러리 없음(`#admin` 해시로 고객/관리자 화면 전환)

## 3. 저장소 / 배포 정보

| 항목 | 값 |
|------|-----|
| GitHub 저장소 | `https://github.com/souvenir-hwang/drone-booth-reserve` |
| 기본 브랜치 | `main` |
| 배포 방식 | `main`에 push → GitHub Actions 자동 빌드/배포 |
| 배포 URL | `https://souvenir-hwang.github.io/drone-booth-reserve/` |
| 개발 환경(참고) | Node v24, npm v11 (Node 18+ 권장) |

## 4. 다른 컴퓨터에서 처음 세팅하는 순서

```bash
# 1) 저장소 클론
git clone https://github.com/souvenir-hwang/drone-booth-reserve.git
cd drone-booth-reserve

# 2) 의존성 설치
npm install

# 3) 환경변수 파일 생성 (.env 는 커밋되지 않음)
cp .env.example .env
#   → .env 를 열어 실제 Supabase 값과 관리자 비밀번호를 채운다 (아래 5번 참고)

# 4) 로컬 개발 서버 실행
npm run dev        # http://localhost:5173

# 빌드 확인이 필요하면
npm run build
npm run preview
```

## 5. 필요한 비밀값(.env / GitHub Secrets)

`.env` 파일과 GitHub 저장소 Secrets 모두 아래 3개 키가 필요합니다.

| 키 | 설명 | 어디서 얻나 |
|----|------|------------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL (`https://<ref>.supabase.co`) | Supabase 대시보드 → Settings → Data API의 API URL에서 `/rest/v1/` 부분을 뺀 값 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(public) 키 | Supabase 대시보드 → Settings → API Keys → **"Legacy anon, service_role"** 탭의 anon key |
| `VITE_ADMIN_PASSWORD` | 관리자 화면 접근 비밀번호 | 직접 임의로 정함 |

> **중요:** 실제 키 값은 이 저장소에 커밋하지 않습니다. 기존 컴퓨터의 `supabase 연동 정보.txt`
> 파일(로컬 전용, gitignore됨)에 실제 값이 들어 있습니다. 그 파일은 **절대 커밋하지 마세요(실 API 키)**.
> 다른 컴퓨터로 옮길 때는 그 값을 안전한 방법(비밀번호 관리자 등)으로 직접 가져오세요.

GitHub Secrets 등록: 저장소 → Settings → Secrets and variables → Actions → New repository secret 에서 위 3개 등록.
(빌드 시점에 워크플로우가 주입합니다.)

## 6. Supabase 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성(무료 플랜)
2. 대시보드 → SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql) **전체를 붙여넣고 Run**
   - `bookings` 테이블 + 제약(화·수·목만, 부스/날짜/시간 중복 방지)
   - Row Level Security + anon 역할 조회/등록/삭제 정책
   - 지난 날짜 예약 차단(Asia/Seoul 기준) — insert 정책에 포함
   - Realtime publication 등록
   - **재실행해도 안전**하게 작성돼 있음(스키마를 고칠 때마다 다시 실행)

## 7. 프로젝트 구조

```
src/
  components/
    DateSelector.jsx      # 팝업 캘린더 + 이전/다음 화살표 날짜 선택 (allowPast 옵션)
    BoothScheduleGrid.jsx # 시간 x 부스 예약 가능/마감 그리드
    BookingModal.jsx      # 이름/연락처 입력 + 개인정보 동의 예약 모달
    PrivacyConsent.jsx    # 개인정보 수집·이용 동의서 문구 + 필수 체크박스
    AdminLogin.jsx        # 관리자 비밀번호 입력
  pages/
    BookingPage.jsx       # 고객 예약 화면
    AdminPage.jsx         # 관리자 화면 (현황 요약 + 날짜별 조회/취소 + 동의 내역)
  hooks/
    useBookings.js        # 날짜별 조회+Realtime+예약/취소, useUpcomingBookings(현황 요약)
    useConsents.js        # 저장된 동의 내역 조회(관리자용)
  lib/supabaseClient.js   # Supabase 클라이언트 초기화
  lib/consent.js          # 동의 내역 저장(saveConsent, upsert) + CONSENT_VERSION
  utils/booking.js        # 부스/시간 상수, 요일·지난날짜 검증(한국시간), 전화번호 검증
supabase/schema.sql       # DB 스키마(bookings, consents) + RLS + Realtime SQL
.github/workflows/deploy.yml  # GitHub Pages 자동 배포
.claude/launch.json       # Claude Code 브라우저 미리보기용 dev 서버 설정 (gitignore됨)
```

## 8. 지금까지 구현된 기능(현재 상태)

- [x] 고객 예약 플로우(날짜→부스/시간→이름·연락처→예약), 실시간 마감 표시
- [x] 관리자 화면(비밀번호 게이트, sessionStorage), 날짜별 조회/취소
- [x] 메인 제목 2줄 표기("삼성중공업 생산AX/PI팀" / "드론 시뮬레이션 부스 예약 시스템")
- [x] 날짜 선택 팝업 캘린더 + 좌우 화살표(하루 전/후 이동)
- [x] 하단 관리자 안내 문구(생산자동화그룹 황** 프로, 내선 14162)
- [x] **지난 날짜 예약 차단**(달력·화살표·시간표·DB 정책 모두, **Asia/Seoul 시간 기준**)
- [x] 관리자 화면 **"예약 현황 한눈에 보기"**(오늘 이후 예약을 날짜별로 요약, 클릭 시 상세 이동)
- [x] **개인정보 수집·이용 동의서**(예약 모달에서 필수 동의 → `consents` 테이블 저장,
      이름+전화번호 동일 시 최신 동의만 유지, 관리자 화면에서 동의 내역 조회)
- [x] GitHub Actions 자동 배포 워크플로우

## 9. Claude Code로 작업할 때 참고사항(개인 설정)

이 항목들은 기존 컴퓨터의 Claude Code **로컬 메모리**에 저장돼 있어 **다른 컴퓨터로 자동 전달되지 않습니다.**
새 컴퓨터에서 Claude Code를 쓸 때 아래를 다시 알려주면 동일하게 동작합니다.

- **말투**: 항상 **평범한 존댓말**로 답변(특별한 페르소나 없음)
- **보안**: `supabase 연동 정보.txt`에는 실제 API 키가 있으니 **절대 커밋 금지**(이미 `.gitignore` 처리됨)
- **커밋 규칙**: 기능 단위로 한글 커밋 메시지 작성, 요청 시에만 push

## 10. 자주 쓰는 명령

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드(배포 전 확인용)
npm run preview    # 빌드 결과 미리보기
git add <파일> && git commit -m "..." && git push origin main   # 커밋 후 push하면 자동 배포
```
