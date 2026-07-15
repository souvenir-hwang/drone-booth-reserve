-- 드론 시뮬레이션 부스 예약 시스템 - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booth text not null check (booth in ('A', 'B')),
  booking_date date not null,
  start_time time not null check (start_time in ('13:00', '14:00', '15:00', '16:00')),
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  customer_phone text not null check (char_length(trim(customer_phone)) > 0),
  created_at timestamptz not null default now(),

  -- 화(2), 수(3), 목(4) 요일에만 예약 가능 (일요일 = 0 기준)
  constraint bookings_valid_weekday check (extract(dow from booking_date) in (2, 3, 4)),

  -- 같은 부스/날짜/시간에 중복 예약 방지 (동시 예약 경합 상황을 DB 레벨에서 차단)
  constraint bookings_unique_slot unique (booth, booking_date, start_time)
);

create index if not exists bookings_date_idx on public.bookings (booking_date);

-- Row Level Security 활성화
alter table public.bookings enable row level security;

-- 이 프로젝트는 GitHub Pages 정적 호스팅 + Supabase 조합이라 별도의 서버/인증 계층이 없습니다.
-- 고객 화면(조회/예약)과 관리자 화면(조회/취소) 모두 anon 키로 동작하므로,
-- anon 역할에 select/insert/delete를 모두 허용합니다.
-- 관리자 비밀번호는 화면 접근을 막는 용도일 뿐 DB 접근 권한 자체를 제한하지는 않습니다.
-- (자세한 내용은 README의 "보안 관련 주의사항" 참고)

drop policy if exists "bookings_select_anon" on public.bookings;
create policy "bookings_select_anon"
  on public.bookings for select
  to anon
  using (true);

drop policy if exists "bookings_insert_anon" on public.bookings;
create policy "bookings_insert_anon"
  on public.bookings for insert
  to anon
  with check (
    extract(dow from booking_date) in (2, 3, 4)
    -- 대한민국(Asia/Seoul) 시간 기준으로 이미 지나간 날짜는 예약 불가
    and booking_date >= (now() at time zone 'Asia/Seoul')::date
  );

drop policy if exists "bookings_delete_anon" on public.bookings;
create policy "bookings_delete_anon"
  on public.bookings for delete
  to anon
  using (true);

-- 실시간(Realtime) 구독 활성화: 고객/관리자 화면이 서로의 예약/취소를 즉시 반영하기 위함
-- 최근 생성된 Supabase 프로젝트는 새 테이블을 supabase_realtime publication에
-- 자동으로 포함시키므로, 이미 등록되어 있으면 건너뛴다 (재실행 시에도 안전하도록).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 개인정보 수집·이용 동의 내역
-- 예약 신청 시 온라인으로 받은 동의를 저장한다.
-- 이름+전화번호가 같으면 마지막에 접수된 동의만 남도록 unique 제약 + upsert 사용.
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  customer_phone text not null check (char_length(trim(customer_phone)) > 0),
  consent_version text not null default 'v1',
  agreed_at timestamptz not null default now(),

  -- 동일인(이름+전화번호)에 대해서는 한 건만 유지 → 재신청 시 최신 동의로 덮어쓰기
  constraint consents_unique_person unique (customer_name, customer_phone)
);

alter table public.consents enable row level security;

-- 고객 화면(익명)에서 동의 저장(upsert)을 하려면 insert + update 권한이 모두 필요하다.
-- 관리자 화면(동일 anon 키)에서 조회할 수 있도록 select 도 허용한다.
drop policy if exists "consents_select_anon" on public.consents;
create policy "consents_select_anon"
  on public.consents for select
  to anon
  using (true);

drop policy if exists "consents_insert_anon" on public.consents;
create policy "consents_insert_anon"
  on public.consents for insert
  to anon
  with check (true);

drop policy if exists "consents_update_anon" on public.consents;
create policy "consents_update_anon"
  on public.consents for update
  to anon
  using (true)
  with check (true);
