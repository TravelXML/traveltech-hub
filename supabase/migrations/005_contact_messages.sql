-- TravelTech Hub - Contact form
--
-- Stores visitor-submitted messages from the public Contact Us form
-- (src/pages/Contact.jsx). Rows are written exclusively by the
-- send-contact-email Edge Function using the service role key, after it
-- verifies the Turnstile token and emails a notification to
-- info@travelpin.space - there is no anon/authenticated insert policy,
-- since the Edge Function is the only writer.
--
-- Run once via `supabase db push` or the SQL Editor.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company text check (company is null or char_length(company) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  source text not null default 'travelpin-contact-form',
  created_at timestamptz not null default now()
);

comment on column public.contact_messages.company is 'Sender-provided company name, if any - included in the notification email so info@travelpin.space knows who a lead is from.';
comment on column public.contact_messages.source is 'Which site/form this came from - lets one inbox distinguish multiple embeds later.';

alter table public.contact_messages enable row level security;

create policy contact_messages_select_admin on public.contact_messages
  for select using (public.is_admin());
