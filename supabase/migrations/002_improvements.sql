-- Run once in Supabase SQL Editor on your EXISTING project. Safe to run again. Keeps all existing data.

-- Ratings: numbers or grades per product
alter table products add column if not exists rating_mode text not null default 'number';
alter table products add column if not exists longevity_grade text not null default '';
alter table products add column if not exists projection_grade text not null default '';
alter table products add column if not exists sillage_grade text not null default '';
alter table products drop constraint if exists products_rating_mode_check;
alter table products add constraint products_rating_mode_check check (rating_mode in ('number','grade'));
alter table products drop constraint if exists products_grades_check;
alter table products add constraint products_grades_check check (
  longevity_grade in ('','Fair','Moderate','Good','Very Good','Excellent') and
  projection_grade in ('','Fair','Moderate','Good','Very Good','Excellent') and
  sillage_grade in ('','Fair','Moderate','Good','Very Good','Excellent'));
alter table products drop constraint if exists products_notes_len;
alter table products add constraint products_notes_len check (char_length(notes) <= 1000);

-- Delivery areas under each location
create table if not exists delivery_areas (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references delivery_zones(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  fee numeric check (fee is null or fee >= 0),
  enabled boolean not null default true,
  sort int not null default 0
);
create index if not exists delivery_areas_zone on delivery_areas (zone_id);
alter table delivery_areas enable row level security;
drop policy if exists "public read enabled areas" on delivery_areas;
create policy "public read enabled areas" on delivery_areas for select using (enabled = true);

-- Orders: email, area, discount, explicit fee-pending flag, payment report time
alter table orders add column if not exists email text not null default '';
alter table orders add column if not exists area text not null default '';
alter table orders add column if not exists requested_area text not null default '';
alter table orders add column if not exists fee_pending boolean not null default false;
alter table orders add column if not exists discount numeric not null default 0;
alter table orders add column if not exists discount_percent smallint not null default 0;
alter table orders add column if not exists promo_title text not null default '';
alter table orders add column if not exists paid_reported_at timestamptz;
update orders set fee_pending = true where zone = 'Other location' and fee_pending = false;
update orders set paid_reported_at = created_at where paid_claimed and paid_reported_at is null;

-- Email log so the same notification is never sent twice
create table if not exists order_notifications (
  order_id uuid not null references orders(id) on delete cascade,
  event text not null,
  sent_at timestamptz not null default now(),
  primary key (order_id, event)
);
alter table order_notifications enable row level security;

-- Promotions
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  headline text not null check (char_length(headline) between 2 and 120),
  body text not null default '' check (char_length(body) <= 300),
  cta_label text not null default '',
  cta_href text not null default '',
  image_url text not null default '',
  placement text not null default 'banner' check (placement in ('bar','banner','popup')),
  discount_percent smallint not null default 0 check (discount_percent between 0 and 90),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table promotions enable row level security;
drop policy if exists "public read live promotions" on promotions;
create policy "public read live promotions" on promotions for select using (
  active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

-- Homepage videos
create table if not exists hero_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  video_url text not null,
  poster_url text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists hero_videos_one_active on hero_videos (active) where active;
alter table hero_videos enable row level security;
drop policy if exists "public read active video" on hero_videos;
create policy "public read active video" on hero_videos for select using (active);
