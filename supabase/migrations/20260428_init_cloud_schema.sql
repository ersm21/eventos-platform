create extension if not exists pgcrypto;

create schema if not exists public;

create table if not exists public.meeting_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_name text,
  customer_email text,
  requested_date date not null,
  requested_time text not null,
  notes text,
  status text default 'pending',
  created_at timestamptz default now(),
  slot_id uuid references public.meeting_slots(id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric,
  category text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  create_at timestamptz default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  status text,
  total numeric,
  created_at timestamptz default now(),
  customer_email text,
  event_type text,
  notes text,
  admin_final_total numeric,
  admin_note text,
  deposit_amount numeric,
  deposit_status text default 'pending',
  deposit_reference text,
  payment_proof_url text,
  payment_proof_name text,
  user_id uuid
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid default gen_random_uuid(),
  product_id uuid default gen_random_uuid(),
  product_name text,
  unit_price numeric not null,
  quantity integer,
  subtotal numeric,
  created_at timestamptz default now()
);