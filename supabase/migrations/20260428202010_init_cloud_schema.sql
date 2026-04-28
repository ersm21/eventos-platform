
  create table "public"."meeting_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "customer_name" text,
    "customer_email" text,
    "requested_date" date not null,
    "requested_time" text not null,
    "notes" text,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "slot_id" uuid
      );



  create table "public"."meeting_slots" (
    "id" uuid not null default gen_random_uuid(),
    "slot_date" date not null,
    "slot_time" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "price" numeric,
    "category" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "role" text,
    "create_at" timestamp with time zone default now()
      );



  create table "public"."quote_items" (
    "id" uuid not null default gen_random_uuid(),
    "quote_id" uuid default gen_random_uuid(),
    "product_id" uuid default gen_random_uuid(),
    "product_name" text,
    "unit_price" numeric not null,
    "quantity" integer,
    "subtotal" numeric,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."quotes" (
    "id" uuid not null default gen_random_uuid(),
    "customer_name" text not null,
    "status" text,
    "total" numeric,
    "created_at" timestamp with time zone default now(),
    "customer_email" text,
    "event_type" text,
    "notes" text,
    "admin_final_total" numeric,
    "admin_note" text,
    "deposit_amount" numeric,
    "deposit_status" text default 'pending'::text,
    "deposit_reference" text,
    "payment_proof_url" text,
    "payment_proof_name" text,
    "user_id" uuid
      );


CREATE UNIQUE INDEX meeting_requests_pkey ON public.meeting_requests USING btree (id);

CREATE UNIQUE INDEX meeting_slots_pkey ON public.meeting_slots USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX quote_items_pkey ON public.quote_items USING btree (id);

CREATE UNIQUE INDEX quotes_pkey ON public.quotes USING btree (id);

alter table "public"."meeting_requests" add constraint "meeting_requests_pkey" PRIMARY KEY using index "meeting_requests_pkey";

alter table "public"."meeting_slots" add constraint "meeting_slots_pkey" PRIMARY KEY using index "meeting_slots_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."quote_items" add constraint "quote_items_pkey" PRIMARY KEY using index "quote_items_pkey";

alter table "public"."quotes" add constraint "quotes_pkey" PRIMARY KEY using index "quotes_pkey";

alter table "public"."meeting_requests" add constraint "meeting_requests_slot_id_fkey" FOREIGN KEY (slot_id) REFERENCES public.meeting_slots(id) not valid;

alter table "public"."meeting_requests" validate constraint "meeting_requests_slot_id_fkey";

grant delete on table "public"."meeting_requests" to "anon";

grant insert on table "public"."meeting_requests" to "anon";

grant references on table "public"."meeting_requests" to "anon";

grant select on table "public"."meeting_requests" to "anon";

grant trigger on table "public"."meeting_requests" to "anon";

grant truncate on table "public"."meeting_requests" to "anon";

grant update on table "public"."meeting_requests" to "anon";

grant delete on table "public"."meeting_requests" to "authenticated";

grant insert on table "public"."meeting_requests" to "authenticated";

grant references on table "public"."meeting_requests" to "authenticated";

grant select on table "public"."meeting_requests" to "authenticated";

grant trigger on table "public"."meeting_requests" to "authenticated";

grant truncate on table "public"."meeting_requests" to "authenticated";

grant update on table "public"."meeting_requests" to "authenticated";

grant delete on table "public"."meeting_requests" to "service_role";

grant insert on table "public"."meeting_requests" to "service_role";

grant references on table "public"."meeting_requests" to "service_role";

grant select on table "public"."meeting_requests" to "service_role";

grant trigger on table "public"."meeting_requests" to "service_role";

grant truncate on table "public"."meeting_requests" to "service_role";

grant update on table "public"."meeting_requests" to "service_role";

grant delete on table "public"."meeting_slots" to "anon";

grant insert on table "public"."meeting_slots" to "anon";

grant references on table "public"."meeting_slots" to "anon";

grant select on table "public"."meeting_slots" to "anon";

grant trigger on table "public"."meeting_slots" to "anon";

grant truncate on table "public"."meeting_slots" to "anon";

grant update on table "public"."meeting_slots" to "anon";

grant delete on table "public"."meeting_slots" to "authenticated";

grant insert on table "public"."meeting_slots" to "authenticated";

grant references on table "public"."meeting_slots" to "authenticated";

grant select on table "public"."meeting_slots" to "authenticated";

grant trigger on table "public"."meeting_slots" to "authenticated";

grant truncate on table "public"."meeting_slots" to "authenticated";

grant update on table "public"."meeting_slots" to "authenticated";

grant delete on table "public"."meeting_slots" to "service_role";

grant insert on table "public"."meeting_slots" to "service_role";

grant references on table "public"."meeting_slots" to "service_role";

grant select on table "public"."meeting_slots" to "service_role";

grant trigger on table "public"."meeting_slots" to "service_role";

grant truncate on table "public"."meeting_slots" to "service_role";

grant update on table "public"."meeting_slots" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."quote_items" to "anon";

grant insert on table "public"."quote_items" to "anon";

grant references on table "public"."quote_items" to "anon";

grant select on table "public"."quote_items" to "anon";

grant trigger on table "public"."quote_items" to "anon";

grant truncate on table "public"."quote_items" to "anon";

grant update on table "public"."quote_items" to "anon";

grant delete on table "public"."quote_items" to "authenticated";

grant insert on table "public"."quote_items" to "authenticated";

grant references on table "public"."quote_items" to "authenticated";

grant select on table "public"."quote_items" to "authenticated";

grant trigger on table "public"."quote_items" to "authenticated";

grant truncate on table "public"."quote_items" to "authenticated";

grant update on table "public"."quote_items" to "authenticated";

grant delete on table "public"."quote_items" to "service_role";

grant insert on table "public"."quote_items" to "service_role";

grant references on table "public"."quote_items" to "service_role";

grant select on table "public"."quote_items" to "service_role";

grant trigger on table "public"."quote_items" to "service_role";

grant truncate on table "public"."quote_items" to "service_role";

grant update on table "public"."quote_items" to "service_role";

grant delete on table "public"."quotes" to "anon";

grant insert on table "public"."quotes" to "anon";

grant references on table "public"."quotes" to "anon";

grant select on table "public"."quotes" to "anon";

grant trigger on table "public"."quotes" to "anon";

grant truncate on table "public"."quotes" to "anon";

grant update on table "public"."quotes" to "anon";

grant delete on table "public"."quotes" to "authenticated";

grant insert on table "public"."quotes" to "authenticated";

grant references on table "public"."quotes" to "authenticated";

grant select on table "public"."quotes" to "authenticated";

grant trigger on table "public"."quotes" to "authenticated";

grant truncate on table "public"."quotes" to "authenticated";

grant update on table "public"."quotes" to "authenticated";

grant delete on table "public"."quotes" to "service_role";

grant insert on table "public"."quotes" to "service_role";

grant references on table "public"."quotes" to "service_role";

grant select on table "public"."quotes" to "service_role";

grant trigger on table "public"."quotes" to "service_role";

grant truncate on table "public"."quotes" to "service_role";

grant update on table "public"."quotes" to "service_role";


