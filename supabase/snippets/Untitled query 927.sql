alter table public.quotes add column if not exists admin_final_total numeric;
alter table public.quotes add column if not exists admin_note text;
alter table public.quotes add column if not exists deposit_amount numeric;
alter table public.quotes add column if not exists deposit_status text default 'pending';
alter table public.quotes add column if not exists deposit_reference text;
alter table public.quotes add column if not exists payment_proof_url text;
alter table public.quotes add column if not exists payment_proof_name text;
alter table public.quotes add column if not exists user_id uuid;
create table if not exists public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  customer_name text,
  customer_email text,
  requested_date date not null,
  requested_time text not null,
  notes text,
  status text default 'pending',
  created_at timestamptz default now()
);create table if not exists public.meeting_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);insert into public.meeting_slots (slot_date, slot_time, is_active)
values
  ('2026-04-28', '10:00', true),
  ('2026-04-28', '11:00', true),
  ('2026-04-28', '15:00', true),
  ('2026-04-29', '09:00', true),
  ('2026-04-29', '14:00', true),
  ('2026-04-30', '16:00', true)
on conflict do nothing;
alter table public.meeting_requests
add column if not exists slot_id uuid;

alter table public.meeting_requests
add constraint meeting_requests_slot_id_fkey
foreign key (slot_id)
references public.meeting_slots (id);
create unique index if not exists meeting_requests_slot_id_unique
on public.meeting_requests (slot_id)
where slot_id is not null;