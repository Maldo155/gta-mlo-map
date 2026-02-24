-- Add columns for webhook PIN claim verification (temporary storage)
-- Run in Supabase SQL editor. Safe to run multiple times.

alter table public.servers add column if not exists claim_pin text;
alter table public.servers add column if not exists claim_pin_expires timestamptz;
alter table public.servers add column if not exists claim_pin_user_id uuid;
