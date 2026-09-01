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

-- ---------- 설정(PIN) : 단일 행 ----------
create table if not exists public.config (
  id        integer primary key,
  admin_pin text not null,
  staff_pin text not null
);

insert into public.config (id, admin_pin, staff_pin)
values (1, '0207', '1111')
on conflict (id) do nothing;

-- ---------- 매장 ----------
create table if not exists public.stores (
  id      text primary key,
  name    text not null unique,
  address text
);

-- ---------- 떡 종류 ----------
create table if not exists public.products (
  id                 integer primary key,
  name               text    not null unique,
  mal                integer not null default 0,
  half               integer,
  cut_select         boolean not null default false,
  note               text,
  surcharge_eligible boolean not null default false,
  active             boolean not null default true
);
-- 최초 목록은 앱이 처음 실행될 때 자동 시딩합니다 (js/store.js seedProductsIfEmpty).

-- ============================================================
-- RLS (Row Level Security)
-- ------------------------------------------------------------
-- 이 앱은 별도 로그인 없이 anon 키로 접근합니다.
-- 아래는 "누구나 읽기/쓰기 가능" 데모 정책입니다.
-- 실제 운영에서는 최소한 다음 중 하나를 검토하세요:
--   * 주문 접수 페이지와 관리 페이지를 분리하고 관리쪽은 Supabase Auth 적용
--   * Edge Function 을 통해서만 쓰기 허용
--   * config 테이블은 service_role 로만 수정
-- ============================================================
alter table public.orders   enable row level security;
alter table public.config   enable row level security;
alter table public.stores   enable row level security;
alter table public.products enable row level security;

drop policy if exists "orders public access" on public.orders;
create policy "orders public access" on public.orders
  for all using (true) with check (true);

drop policy if exists "config public access" on public.config;
create policy "config public access" on public.config
  for all using (true) with check (true);

drop policy if exists "stores public access" on public.stores;
create policy "stores public access" on public.stores
  for all using (true) with check (true);

drop policy if exists "products public access" on public.products;
create policy "products public access" on public.products
  for all using (true) with check (true);
