-- Run once in Supabase SQL Editor (after 002). Safe to run again. Keeps all existing data.

-- Reviews: your current reviews keep their order at the top. Admin can reorder them.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'reviews' and column_name = 'sort_order') then
    alter table reviews add column sort_order int;
    update reviews r set sort_order = x.rn * 10
      from (select id, row_number() over (order by created_at desc) rn from reviews where target = 'store' and status = 'visible') x
      where r.id = x.id;
  end if;
end $$;

-- Home page slides (image or video), controlled by the admin
create table if not exists hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 80),
  kind text not null default 'image' check (kind in ('image','video')),
  image_url text not null default '',
  image_wide_url text not null default '',
  video_url text not null default '',
  poster_url text not null default '',
  href text not null default '',
  sort int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table hero_slides enable row level security;
drop policy if exists "public read live slides" on hero_slides;
create policy "public read live slides" on hero_slides for select using (
  active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

-- Header photo for each page
create table if not exists page_headers (page text primary key, image_url text not null default '');
alter table page_headers enable row level security;
drop policy if exists "public read page headers" on page_headers;
create policy "public read page headers" on page_headers for select using (true);

-- Rotating one-line announcements above the header
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 120),
  href text not null default '',
  sort int not null default 0,
  active boolean not null default true
);
alter table announcements enable row level security;
drop policy if exists "public read active announcements" on announcements;
create policy "public read active announcements" on announcements for select using (active);
