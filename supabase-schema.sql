-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR CYBER-RESUME & ADMIN PORTAL
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- ==============================================================================

-- 1. PROFILES TABLE (Role-Based Access Control)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text not null default 'guest', -- 'admin' or 'guest'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Allow all users to read profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. AUTOMATIC FIRST-ADMIN & PROFILE CREATION TRIGGER
-- The first user to ever log in is automatically granted 'admin' role!
-- All subsequent users receive 'guest' role.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  admin_count int;
begin
  select count(*) into admin_count from public.profiles where role = 'admin';
  
  if admin_count = 0 then
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'admin');
  else
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'guest');
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution on auth.users creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. SITE CONTENT TABLE (Stores Dynamic Resume & Profile Data)
create table if not exists public.site_content (
  id text primary key default 'primary_resume',
  content jsonb not null,
  recipient_email text not null default 'akash.singh_96@outlook.com',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on site_content
alter table public.site_content enable row level security;

-- Anyone (public/anon/guest) can view the site content
create policy "Allow public read of site content"
  on public.site_content for select
  using (true);

-- Only users with role = 'admin' in profiles can update or insert site content
create policy "Allow admin write of site content"
  on public.site_content for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 4. CONTACT MESSAGES TABLE (Stores Inquiries Sent from Website)
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  query text not null,
  status text default 'unread',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on contact_messages
alter table public.contact_messages enable row level security;

-- Anyone can submit a contact inquiry
create policy "Allow public to insert contact messages"
  on public.contact_messages for insert
  with check (true);

-- Only admins can read contact messages
create policy "Allow admin to read contact messages"
  on public.contact_messages for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Only admins can update contact messages (edit name, email, query, status)
create policy "Allow admin to update contact messages"
  on public.contact_messages for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Only admins can delete contact messages
create policy "Allow admin to delete contact messages"
  on public.contact_messages for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 5. ARCHIVED MESSAGES TABLE (Retains Deleted Messages for 30 Days)
create table if not exists public.archived_messages (
  id uuid primary key,
  name text not null,
  email text not null,
  query text not null,
  status text default 'archived',
  created_at timestamp with time zone not null,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on archived_messages
alter table public.archived_messages enable row level security;

-- Only admins can access or manage archived messages
create policy "Allow admin full access to archived messages"
  on public.archived_messages for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Auto-purge procedure for messages older than 30 days
create or replace function public.purge_old_archived_messages()
returns void as $$
begin
  delete from public.archived_messages
  where archived_at < (now() - interval '30 days');
end;
$$ language plpgsql security definer;

-- 6. INITIALIZE DEFAULT CONTENT RECORD (If not present)
insert into public.site_content (id, content, recipient_email)
values (
  'primary_resume',
  '{
    "hero": {
      "name": "AKASH SINGH",
      "role": "Technical Solutions Consultant | 8+ Years Experience",
      "location": "Bengaluru, Karnataka",
      "github": "https://github.com/officialakash96/",
      "linkedin": "https://www.linkedin.com/in/akashsinghjsr/",
      "resumeUrl": "static/Resume_AkashSingh.pdf"
    },
    "summary": [
      "Core Expertise: Enterprise API Integrations, Technical Troubleshooting, Automation using PowerShell, Python & HTML, Site Reliability Engineering (SRE), and Technical Consultation.",
      "Key Strengths: Root Cause Analysis (RCA) for mission-critical issues under strict SLAs; deep log and payload tracing (HAR/JSON/REST).",
      "Current Focus: Advancing Data Science & Machine Learning specialization via IIT Guwahati (E&ICT Academy) in collaboration with NSDC & Masai.",
      "Additional Competencies: Cross-functional technical alignment, incident management, generative AI workflow integration, and autonomous learning agility."
    ]
  }'::jsonb,
  'akash.singh_96@outlook.com'
)
on conflict (id) do nothing;
