-- ============================================================
-- 떡 주문 관리 · Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- ============================================================

-- ---------- 주문 ----------
create table if not exists public.orders (
  id                text primary key,
  created_at        timestamptz not null default now(),
  status            text        not null default '접수',
  phone             text        not null default '',
  in_store          boolean     not null default false,
  delivery_date     date        not null,
  memo              text,
  receive_method    text,               -- 'store' | 'delivery'
  store_name        text,
  address           text,
  items             jsonb       not null default '[]'::jsonb,
  ritual            jsonb       not null default '[]'::jsonb,
  items_total       integer     not null default 0,
  surcharge_applies boolean     not null default false,
  surcharge_units   numeric     not null default 0,
  surcharge_amount  integer     not null default 0,
  total             integer     not null default 0
);

create index if not exists orders_delivery_date_idx on public.orders (delivery_date);
create index if not exists orders_phone_idx on public.orders (phone);

-- 기존 프로젝트 업그레이드용 (이미 orders 테이블이 있는 경우 재실행해도 안전)
alter table public.orders alter column phone drop not null;
alter table public.orders alter column phone set default '';
update public.orders set phone = '' where phone is null;
alter table public.orders alter column phone set not null;
alter table public.orders add column if not exists in_store boolean not null default false;

-- ---------- 설정(PIN) 테이블 제거 ----------
-- PIN 방식 직원 인증은 폐지되고 Supabase Auth 로그인으로 대체되었습니다.
-- 예전 버전에서 만들어진 config 테이블이 있으면 정리합니다. (없어도 오류 없음)
drop table if exists public.config;

-- ---------- 매장 ----------
-- id 는 앱( genId('ST') )처럼 자동 생성됩니다. CSV/시드에는 name, address 만 넣으면 됩니다.
create table if not exists public.stores (
  id      text primary key default ('ST' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  name    text not null unique,
  address text
);
-- 기존 프로젝트 업그레이드용
alter table public.stores alter column id set default ('ST' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));

-- ---------- 떡 종류 ----------
create table if not exists public.products (
  id                 integer primary key,
  name               text    not null unique,
  mal                integer not null default 0,   -- 1말(10kg) 가격
  half               integer,                      -- 1/2말(5kg) 가격, 없으면 null
  kg                 integer not null default 0,   -- 1kg 가격
  piece_price        integer not null default 0,   -- 낱개(1개) 가격, 0 이면 낱개 주문 불가
  cut_select         boolean not null default false,
  note               text,
  surcharge_eligible boolean not null default false,
  active             boolean not null default true
);

-- 기존 프로젝트 업그레이드용 (컬럼 추가 + 값 채우기, 재실행 안전)
alter table public.products add column if not exists kg          integer not null default 0;
alter table public.products add column if not exists piece_price integer not null default 0;
update public.products
  set kg = case when half is not null and half > 0
                then round(half / 5.0)::int
                else round(mal / 10.0)::int end
  where kg = 0;
update public.products set piece_price = 1000
  where piece_price = 0
    and name in ('약식','영양찰떡(호박)','영양찰떡(흑미)','영양찰떡(흰쌀)','밥알쑥찰떡');
-- 마구설기 4종 분리
update public.products set name = '마구설기(콩)' where name = '마구설기';
insert into public.products (id, name, mal, half, kg, piece_price, cut_select, surcharge_eligible, active) values
  (35, '마구설기(쑥)',   100000, 50000, 10000, 0, true, false, true),
  (36, '마구설기(호박)', 100000, 50000, 10000, 0, true, false, true),
  (37, '마구설기(흑미)', 100000, 50000, 10000, 0, true, false, true)
on conflict (id) do nothing;

-- 떡 종류 전체 목록을 통째로 갈아끼우려면 supabase/products.csv 를
-- Table Editor → products → Import data via CSV 로 올리세요 (기존 행 삭제 후).

-- ============================================================
-- RLS (Row Level Security)
-- ------------------------------------------------------------
-- 고객(비로그인, anon 키)      : 새 주문 insert / 매장·떡 목록 조회만 가능.
-- 직원(Supabase Auth 로그인)   : 주문 조회·수정·삭제, 매장·떡 목록 관리 가능.
-- 직원 계정은 대시보드 → Authentication → Users 에서 직접 만듭니다
-- (이 앱에는 회원가입 화면이 없습니다).
-- ============================================================
alter table public.orders   enable row level security;
alter table public.stores   enable row level security;
alter table public.products enable row level security;

-- 기존 "누구나 읽기/쓰기" 데모 정책 제거
drop policy if exists "orders public access" on public.orders;
drop policy if exists "stores public access" on public.stores;
drop policy if exists "products public access" on public.products;

-- ---------- orders : insert 는 누구나, 조회/수정/삭제는 로그인한 직원만 ----------
drop policy if exists "orders insert any" on public.orders;
create policy "orders insert any" on public.orders
  for insert
  with check (true);

drop policy if exists "orders select staff" on public.orders;
create policy "orders select staff" on public.orders
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "orders update staff" on public.orders;
create policy "orders update staff" on public.orders
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "orders delete staff" on public.orders;
create policy "orders delete staff" on public.orders
  for delete
  using (auth.role() = 'authenticated');

-- ---------- stores : 조회는 누구나(주문 폼에 필요), 쓰기는 직원만 ----------
drop policy if exists "stores select any" on public.stores;
create policy "stores select any" on public.stores
  for select using (true);

drop policy if exists "stores insert staff" on public.stores;
create policy "stores insert staff" on public.stores
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "stores update staff" on public.stores;
create policy "stores update staff" on public.stores
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "stores delete staff" on public.stores;
create policy "stores delete staff" on public.stores
  for delete using (auth.role() = 'authenticated');

-- ---------- products : 조회는 누구나(주문 폼에 필요), 쓰기는 직원만 ----------
drop policy if exists "products select any" on public.products;
create policy "products select any" on public.products
  for select using (true);

drop policy if exists "products insert staff" on public.products;
create policy "products insert staff" on public.products
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "products update staff" on public.products;
create policy "products update staff" on public.products
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "products delete staff" on public.products;
create policy "products delete staff" on public.products
  for delete using (auth.role() = 'authenticated');
