-- ScentbyBecca database. Run this whole file once in Supabase: SQL Editor > New query > paste > Run.
create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null check (char_length(name) between 2 and 100),
  brand text not null default '',
  category text not null,
  sub text not null default '',
  audience text not null default '' check (audience in ('','Men','Women','Unisex')),
  concentration text not null default '',
  description text not null default '' check (char_length(description) <= 2000),
  notes text not null default '',
  longevity smallint check (longevity between 1 and 10),
  projection smallint check (projection between 1 and 10),
  sillage smallint check (sillage between 1 and 10),
  images text[] not null default '{}',
  variants jsonb not null default '[]',
  combo boolean not null default true,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_status_category on products (status, category);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  target text not null default 'store',
  name text not null check (char_length(name) between 2 and 60),
  rating smallint not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 10 and 1500),
  images text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','visible','hidden')),
  reply text not null default '',
  seen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_target_status on reviews (target, status);

create table if not exists covers (category text primary key, images text[] not null default '{}');
create table if not exists shelves (key text primary key, ids text[] not null default '{}');
create table if not exists settings (key text primary key, value jsonb not null default '{}');
create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(), name text not null, fee numeric not null default 0 check (fee >= 0),
  enabled boolean not null default false, sort int not null default 0
);
create table if not exists banks (
  id uuid primary key default gen_random_uuid(), bank text not null, name text not null, number text not null, active boolean not null default true
);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  items jsonb not null,
  subtotal numeric not null,
  zone text not null default '',
  delivery_fee numeric,
  name text not null, phone text not null, address text not null, notes text not null default '',
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','dispatched','delivered','cancelled')),
  paid_claimed boolean not null default false,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists orders_status on orders (status, created_at desc);

-- Row Level Security: the public can only READ published content. Every write goes through the server with the service key.
alter table products enable row level security;
alter table reviews enable row level security;
alter table covers enable row level security;
alter table shelves enable row level security;
alter table settings enable row level security;
alter table delivery_zones enable row level security;
alter table banks enable row level security;
alter table orders enable row level security;
drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select using (status = 'active');
drop policy if exists "public read visible reviews" on reviews;
create policy "public read visible reviews" on reviews for select using (status = 'visible');
drop policy if exists "public read covers" on covers;
create policy "public read covers" on covers for select using (true);
drop policy if exists "public read shelves" on shelves;
create policy "public read shelves" on shelves for select using (true);
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);
drop policy if exists "public read enabled zones" on delivery_zones;
create policy "public read enabled zones" on delivery_zones for select using (enabled = true);
-- banks and orders have no public policy: only the server can read them.

-- Photo storage (public read, server-only write)
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');

-- Starting data
insert into settings (key, value) values ('orders', '{"paused": false, "message": ""}') on conflict (key) do nothing;
insert into delivery_zones (name, fee, enabled, sort) select * from (values ('Ilorin', 0, false, 1), ('Ibadan', 0, false, 2), ('Lagos', 0, false, 3)) v(name, fee, enabled, sort) where not exists (select 1 from delivery_zones);
insert into banks (bank, name, number, active) select 'OPay', 'Rebecca Jesudunmomi Alade', '8109245547', true where not exists (select 1 from banks);
