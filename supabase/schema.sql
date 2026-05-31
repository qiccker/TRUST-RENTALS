-- TRUST RENTALS Supabase schema
-- Run this in the Supabase SQL editor for a new project.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

do $$
begin
  create type public.app_role as enum ('customer', 'staff', 'admin');
exception when duplicate_object then null;
end $$;



do $$
begin
  create type public.vehicle_type as enum (
    'sedan',
    'suv',
    'hatchback',
    'van',
    'truck',
    'luxury',
    'convertible',
    'ev'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum (
    'pending_payment',
    'confirmed',
    'cancelled',
    'completed',
    'payment_failed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_status as enum (
    'unsubmitted',
    'pending',
    'verified',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  gov_id_url text,
  driving_license_url text,
  document_status public.document_status not null default 'unsubmitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (
    full_name is null or char_length(full_name) between 1 and 120
  ),
  constraint profiles_phone_length check (
    phone is null or char_length(phone) between 7 and 32
  )
);

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.vehicle_type not null,
  seats integer not null,
  price_per_day numeric(10,2) not null,
  description text not null default '',
  transmission text not null default 'automatic',
  fuel_type text,
  luggage_capacity integer,
  features text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cars_name_length check (char_length(name) between 1 and 120),
  constraint cars_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint cars_seats_range check (seats between 1 and 20),
  constraint cars_price_positive check (price_per_day > 0),
  constraint cars_transmission_allowed check (transmission in ('automatic', 'manual')),
  constraint cars_luggage_capacity_valid check (
    luggage_capacity is null or luggage_capacity between 0 and 20
  )
);

create table if not exists public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint car_images_url_not_blank check (char_length(trim(url)) > 0),
  constraint car_images_sort_order_valid check (sort_order >= 0),
  constraint car_images_alt_text_length check (
    alt_text is null or char_length(alt_text) <= 160
  )
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  total_price numeric(10,2) not null default 0,
  status public.booking_status not null default 'pending_payment',
  expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_date_order check (start_date < end_date),
  constraint bookings_customer_name_length check (char_length(customer_name) between 1 and 120),
  constraint bookings_customer_email_format check (
    customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  constraint bookings_customer_phone_length check (
    customer_phone is null or char_length(customer_phone) between 7 and 32
  ),
  constraint bookings_total_price_valid check (total_price >= 0),
  constraint bookings_pending_has_expiry check (
    status <> 'pending_payment' or expires_at is not null
  )
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists cars_available_type_idx on public.cars(is_available, type);
create index if not exists cars_seats_idx on public.cars(seats);
create index if not exists cars_price_per_day_idx on public.cars(price_per_day);
create index if not exists car_images_car_sort_idx on public.car_images(car_id, sort_order);
create unique index if not exists car_images_one_primary_per_car_idx
  on public.car_images(car_id)
  where is_primary;
create index if not exists bookings_user_created_idx on public.bookings(user_id, created_at desc);
create index if not exists bookings_car_dates_idx on public.bookings(car_id, start_date, end_date);
create index if not exists bookings_status_idx on public.bookings(status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_no_overlapping_active_dates'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_no_overlapping_active_dates
      exclude using gist (
        car_id with =,
        daterange(start_date, end_date, '[)') with &&
      )
      where (status in ('pending_payment', 'confirmed'));
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role()::text in ('admin', 'staff'), false)
$$;

create or replace function public.prevent_unsafe_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.prepare_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  daily_price numeric(10,2);
begin
  if new.start_date >= new.end_date then
    raise exception 'Booking end_date must be after start_date';
  end if;

  if tg_op = 'INSERT' and new.start_date < current_date then
    raise exception 'Booking start_date cannot be in the past';
  end if;

  select price_per_day
  into daily_price
  from public.cars
  where id = new.car_id
    and is_available = true;

  if daily_price is null then
    raise exception 'Car is not available for booking';
  end if;

  new.total_price = daily_price * (new.end_date - new.start_date);

  if new.status = 'pending_payment'::public.booking_status and new.expires_at is null then
    new.expires_at = now() + interval '30 minutes';
  end if;

  if new.status <> 'pending_payment'::public.booking_status then
    new.expires_at = null;
  end if;

  if new.status = 'confirmed'::public.booking_status and new.confirmed_at is null then
    new.confirmed_at = now();
  end if;

  if new.status = 'cancelled'::public.booking_status and new.cancelled_at is null then
    new.cancelled_at = now();
  end if;

  new.updated_at = now();
  return new;
end;
$$;



create or replace function public.cancel_expired_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  update public.bookings
  set
    status = 'cancelled'::public.booking_status,
    cancelled_at = coalesce(cancelled_at, now()),
    updated_at = now()
  where status = 'pending_payment'::public.booking_status
    and expires_at < now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

create or replace function public.car_is_available_for_range(
  p_car_id uuid,
  p_start_date date,
  p_end_date date
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.cars c
    where c.id = p_car_id
      and c.is_available = true
  )
  and p_start_date < p_end_date
  and not exists (
    select 1
    from public.bookings b
    where b.car_id = p_car_id
      and b.status in ('pending_payment'::public.booking_status, 'confirmed'::public.booking_status)
      and (b.status = 'confirmed'::public.booking_status or b.expires_at > now())
      and daterange(b.start_date, b.end_date, '[)') && daterange(p_start_date, p_end_date, '[)')
  )
$$;

create or replace function public.get_car_booked_ranges(p_car_id uuid)
returns table (
  start_date date,
  end_date date,
  status public.booking_status
)
language sql
security definer
stable
set search_path = public
as $$
  select b.start_date, b.end_date, b.status
  from public.bookings b
  join public.cars c on c.id = b.car_id
  where b.car_id = p_car_id
    and c.is_available = true
    and b.status in ('pending_payment'::public.booking_status, 'confirmed'::public.booking_status)
    and (b.status = 'confirmed'::public.booking_status or b.expires_at > now())
  order by b.start_date;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_prevent_unsafe_role_change on public.profiles;
create trigger profiles_prevent_unsafe_role_change
before update on public.profiles
for each row execute function public.prevent_unsafe_profile_role_change();

drop trigger if exists cars_set_updated_at on public.cars;
create trigger cars_set_updated_at
before update on public.cars
for each row execute function public.set_updated_at();

drop trigger if exists car_images_set_updated_at on public.car_images;
create trigger car_images_set_updated_at
before update on public.car_images
for each row execute function public.set_updated_at();

drop trigger if exists bookings_prepare on public.bookings;
create trigger bookings_prepare
before insert or update on public.bookings
for each row execute function public.prepare_booking();



drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "cars_public_select_available" on public.cars;
create policy "cars_public_select_available"
on public.cars
for select
to anon, authenticated
using (is_available = true);

drop policy if exists "cars_admin_all" on public.cars;
create policy "cars_admin_all"
on public.cars
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "car_images_public_select_available" on public.car_images;
create policy "car_images_public_select_available"
on public.car_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cars c
    where c.id = car_images.car_id
      and c.is_available = true
  )
);

drop policy if exists "car_images_admin_all" on public.car_images;
create policy "car_images_admin_all"
on public.car_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
on public.bookings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all"
on public.bookings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
on public.bookings
for insert
to authenticated
with check (user_id = auth.uid());


insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'car-images',
  'car-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_public_read_car_images" on storage.objects;
create policy "storage_public_read_car_images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'car-images');

drop policy if exists "storage_admin_insert_car_images" on storage.objects;
create policy "storage_admin_insert_car_images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'car-images' and public.is_admin());

drop policy if exists "storage_admin_update_car_images" on storage.objects;
create policy "storage_admin_update_car_images"
on storage.objects
for update
to authenticated
using (bucket_id = 'car-images' and public.is_admin())
with check (bucket_id = 'car-images' and public.is_admin());

drop policy if exists "storage_admin_delete_car_images" on storage.objects;
create policy "storage_admin_delete_car_images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'car-images' and public.is_admin());

-- Customer Documents Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-documents',
  'customer-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage_user_insert_own_documents" on storage.objects;
create policy "storage_user_insert_own_documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'customer-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_user_select_own_documents" on storage.objects;
create policy "storage_user_select_own_documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'customer-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_admin_select_all_documents" on storage.objects;
create policy "storage_admin_select_all_documents"
on storage.objects
for select
to authenticated
using (bucket_id = 'customer-documents' and public.is_admin());

grant usage on schema public to anon, authenticated;

grant select on public.cars, public.car_images to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.cars to authenticated;
grant select, insert, update, delete on public.car_images to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.car_is_available_for_range(uuid, date, date) to anon, authenticated;
grant execute on function public.get_car_booked_ranges(uuid) to anon, authenticated;

revoke all on function public.cancel_expired_pending_bookings() from public;
grant execute on function public.cancel_expired_pending_bookings() to service_role;

-- Performance & Reliability Additions

-- 1. pg_cron for expired bookings
create extension if not exists pg_cron with schema extensions;

do $cronsetup$
begin
  if not exists (select 1 from cron.job where jobname = 'cancel_expired_bookings') then
    perform cron.schedule(
      'cancel_expired_bookings',
      '* * * * *',
      $cron$ select public.cancel_expired_pending_bookings(); $cron$
    );
  end if;
end $cronsetup$;

-- 2. RPC for admin dashboard stats
create or replace function public.get_admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  total_revenue numeric;
  total_cars int;
  available_cars int;
  total_customers int;
  total_staff int;
  confirmed_bookings int;
  pending_bookings int;
  cancelled_bookings int;
  pending_revenue numeric;
  cancelled_revenue numeric;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select count(*) into total_cars from public.cars;
  select count(*) into available_cars from public.cars where is_available = true;
  
  select count(*) into total_customers from public.profiles where role = 'customer';
  select count(*) into total_staff from public.profiles where role in ('staff', 'admin');

  select 
    count(*) filter (where status = 'confirmed'),
    coalesce(sum(total_price) filter (where status = 'confirmed'), 0),
    count(*) filter (where status = 'pending_payment'),
    coalesce(sum(total_price) filter (where status = 'pending_payment'), 0),
    count(*) filter (where status = 'cancelled'),
    coalesce(sum(total_price) filter (where status = 'cancelled'), 0)
  into 
    confirmed_bookings, total_revenue,
    pending_bookings, pending_revenue,
    cancelled_bookings, cancelled_revenue
  from public.bookings;

  return json_build_object(
    'total_revenue', total_revenue,
    'total_cars', total_cars,
    'available_cars', available_cars,
    'total_customers', total_customers,
    'total_staff', total_staff,
    'confirmed_bookings', confirmed_bookings,
    'pending_bookings', pending_bookings,
    'pending_revenue', pending_revenue,
    'cancelled_bookings', cancelled_bookings,
    'cancelled_revenue', cancelled_revenue
  );
end;
$$;

grant execute on function public.get_admin_dashboard_stats() to authenticated;

-- Add rejected status to enum
alter type public.booking_status add value if not exists 'rejected';

-- Create booking activity logs table
create table if not exists public.booking_activity_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Enable RLS on booking_activity_logs
alter table public.booking_activity_logs enable row level security;

drop policy if exists "booking_activity_logs_admin_staff_select" on public.booking_activity_logs;
create policy "booking_activity_logs_admin_staff_select"
on public.booking_activity_logs
for select
to authenticated
using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'staff')
);

drop policy if exists "booking_activity_logs_customer_select" on public.booking_activity_logs;
create policy "booking_activity_logs_customer_select"
on public.booking_activity_logs
for select
to authenticated
using (
  exists (
    select 1 from public.bookings 
    where bookings.id = booking_activity_logs.booking_id 
    and bookings.user_id = auth.uid()
  )
);

-- RPC for updating booking status with logging
create or replace function public.admin_update_booking_status(
  p_booking_id uuid,
  p_new_status public.booking_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role public.app_role;
  current_status public.booking_status;
  action_name text;
begin
  -- Get caller role
  select role into caller_role from public.profiles where id = auth.uid();
  
  if caller_role not in ('admin', 'staff') then
    raise exception 'Unauthorized';
  end if;

  -- Get current status
  select status into current_status from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found';
  end if;

  -- Determine action name for log
  if current_status in ('confirmed', 'rejected') then
    action_name := 'Overridden to ' || initcap(p_new_status::text);
  else
    if p_new_status = 'confirmed' then
      action_name := 'Approved';
    elsif p_new_status = 'rejected' then
      action_name := 'Rejected';
    elsif p_new_status = 'cancelled' then
      action_name := 'Cancelled';
    else
      action_name := 'Status changed to ' || p_new_status::text;
    end if;
  end if;

  -- Update booking
  update public.bookings 
  set status = p_new_status
  where id = p_booking_id;

  -- Insert log
  insert into public.booking_activity_logs (booking_id, user_id, action, reason)
  values (p_booking_id, auth.uid(), action_name, p_reason);

end;
$$;

grant execute on function public.admin_update_booking_status(uuid, public.booking_status, text) to authenticated;

-- Razorpay Payment Integration
alter table public.bookings add column if not exists razorpay_order_id text;
alter table public.bookings add column if not exists razorpay_payment_id text;

-- ============================================================
-- Reviews table
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

-- One review per booking
create unique index if not exists reviews_booking_unique on public.reviews(booking_id);

-- RLS
alter table public.reviews enable row level security;

drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews for select using (true);

drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update" on public.reviews for update to authenticated
  using (auth.uid() = user_id);
