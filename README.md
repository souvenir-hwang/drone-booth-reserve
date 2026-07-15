# 드론 시뮬레이션 부스 예약 시스템

드론 시뮬레이션 체험 부스(Booth A, Booth B)를 화·수·목요일 13:00~17:00 사이 1시간 단위로
예약할 수 있는 웹앱입니다. React + Vite로 만들었고, 백엔드 서버 없이 **GitHub Pages(정적 호스팅)**
+ **Supabase(BaaS)** 조합으로 배포합니다.

- 고객 화면: 날짜/부스/시간 선택 → 이름, 연락처 입력 → 예약. 다른 사람이 예약한 시간대는
  실시간으로 "예약 마감"으로 표시됩니다.
- 관리자 화면(`#admin`): 비밀번호 입력 후 날짜별 예약 목록(시간/이름/연락처) 확인 및 취소.

## 왜 Supabase인가

GitHub Pages는 정적 파일만 서빙하므로 예약 데이터를 저장할 서버가 없습니다. 하지만 여러 고객이
동시에 예약 현황을 보고 예약해야 하므로 데이터를 어딘가에는 공유 저장해야 합니다. Supabase는

- **무료 플랜으로 Postgres DB**를 제공하고 (프로젝트 1개, 500MB 기준)
- 브라우저에서 바로 호출 가능한 **REST API + Realtime(실시간 구독) API**를 무료로 제공해서

별도 서버 코드 없이 브라우저(anon key)에서 직접 DB를 조회/삽입/삭제하고, 다른 사용자의 변경사항을
실시간으로 받아볼 수 있습니다. 그래서 "백엔드 서버 없이 실시간 공유 데이터"라는 요구사항에 가장
잘 맞습니다.

## 기술 스택

- React 18 + Vite 5
- Tailwind CSS 3 (다크/레이더 테마)
- Supabase JS SDK (`@supabase/supabase-js`) — DB 조회/삽입/삭제 + Realtime 구독
- 상태관리는 React 기본 훅(`useState`, `useEffect`, 커스텀 훅)만 사용

## 프로젝트 구조

```
src/
  components/       # DateSelector, BoothScheduleGrid, BookingModal, AdminLogin
  pages/            # BookingPage(고객), AdminPage(관리자)
  hooks/useBookings.js   # 조회 + 실시간 구독 + 예약/취소 로직
  lib/supabaseClient.js  # Supabase 클라이언트 초기화
  utils/booking.js       # 부스/시간슬롯 상수, 요일 검증, 전화번호 검증
supabase/schema.sql # DB 테이블 + RLS 정책 + Realtime 활성화 SQL
.github/workflows/deploy.yml # GitHub Pages 자동 배포 워크플로우
```

라우팅은 별도 라이브러리 없이 `#admin` 해시로 고객/관리자 화면을 전환합니다 (정적 호스팅에서
새로고침해도 깨지지 않도록).

---

## 1. Supabase 프로젝트 생성 및 스키마 적용

1. [supabase.com](https://supabase.com) 가입 후 **New Project** 생성 (무료 플랜, 리전은 가까운 곳 선택).
2. 프로젝트가 준비되면 좌측 메뉴 **SQL Editor** 로 이동.
3. 이 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용 전체를 복사해서 붙여넣고 **Run** 실행.
   - `bookings` 테이블 생성
   - 화/수/목 요일만 허용하는 체크 제약, 중복 예약 방지 유니크 제약, 지난 날짜 예약 차단(Asia/Seoul 기준)
   - Row Level Security 활성화 + anon 역할에 조회/등록/삭제 정책 부여
   - Realtime 발행(publication)에 테이블 추가
   - `consents` 테이블 생성(개인정보 수집·이용 동의 내역): 이름+전화번호가 같으면
     마지막 동의만 남도록 유니크 제약 + upsert, anon 역할에 조회/등록/수정 정책 부여
4. 좌측 메뉴 **Project Settings → API** 에서 다음 두 값을 복사해둡니다.
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 보안 관련 주의사항 (꼭 읽어주세요)

이 프로젝트는 서버가 없는 정적 사이트이기 때문에 고객 화면과 관리자 화면 모두 **동일한 anon key**로
Supabase에 접근합니다. 즉:

- 관리자 비밀번호(`VITE_ADMIN_PASSWORD`)는 **관리자 화면 UI 진입을 막는 용도**이지, Supabase
  데이터베이스 자체에 대한 접근 권한을 제한하는 것은 아닙니다. 빌드된 JS 번들에는 값이 포함되므로
  완전한 비밀로 취급하면 안 됩니다.
- 이 정도 보호로 충분한 소규모/내부용 예약 시스템에 적합합니다. 더 강한 보안이 필요하다면 Supabase
  Auth(이메일/매직링크 로그인)와 RLS 정책을 관리자 역할 기반으로 강화하는 것을 고려하세요.

## 2. 로컬 개발 실행 방법

```bash
npm install
cp .env.example .env   # 이후 .env 파일을 열어 실제 값으로 채우기
npm run dev
```

`.env` 파일 예시는 [`.env.example`](.env.example) 참고:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ADMIN_PASSWORD=change-this-password
```

`.env`는 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

빌드 확인:

```bash
npm run build
npm run preview
```

## 3. GitHub Secrets 등록 방법

GitHub Actions가 빌드 시점에 Supabase 접속 정보와 관리자 비밀번호를 주입하려면 저장소에 Secrets를
등록해야 합니다.

1. GitHub 저장소 페이지 → **Settings → Secrets and variables → Actions**
2. **New repository secret** 클릭 후 아래 3개를 각각 등록:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
3. 값은 로컬 `.env`에 사용한 것과 동일하게(또는 운영용 값으로) 입력합니다.

## 4. GitHub Pages 배포 방법

1. 이 프로젝트를 GitHub 저장소에 push합니다 (`main` 브랜치).
2. 저장소 **Settings → Pages** 로 이동.
3. **Build and deployment → Source** 를 **GitHub Actions** 로 설정합니다.
4. `main` 브랜치에 push하면 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 워크플로우가
   자동으로 실행되어 빌드 후 Pages에 배포합니다. (Actions 탭에서 진행 상황 확인 가능)
5. 배포가 끝나면 `https://<GitHub 계정명>.github.io/<저장소 이름>/` 주소로 접속할 수 있습니다.

> `vite.config.js`의 `base` 경로는 워크플로우에서 저장소 이름을 이용해 자동으로
> `/<저장소 이름>/` 형태로 주입됩니다. 커스텀 도메인을 쓸 경우 워크플로우의 `VITE_BASE_PATH`를
> `/`로 바꿔주세요.

## 5. 사용 방법 요약

- 고객: 메인 화면(`/`)에서 날짜(화/수/목만 가능) → 부스/시간 선택 → 이름/연락처 입력 → 예약.
- 관리자: 화면 하단 "관리자 화면" 링크(`/#admin`) → 비밀번호 입력 → 날짜별 예약 확인/취소.
