-- ═══════════════════════════════════════════════════════════════════════
-- Journal public du MJ et notes personnelles des joueurs.
--
-- Deux registres qui ne se mélangent jamais : le journal est écrit par le
-- MJ et lu par toute la table ; les notes sont personnelles, exclusives à
-- qui les écrit — même le MJ ne les voit pas (voir 0004 pour la nuance
-- apportée ensuite : le MJ les LIT, il ne les écrit toujours jamais).
-- ═══════════════════════════════════════════════════════════════════════

create table public.jg_journal_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  title text check (title is null or char_length(title) <= 160),
  body text not null check (char_length(body) >= 1 and char_length(body) <= 12000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jg_journal_entries enable row level security;

create trigger jg_journal_entries_version
  before update on public.jg_journal_entries
  for each row execute function jg_bump_version();

create policy jg_journal_entries_read on public.jg_journal_entries
  for select using (jg_is_member(campaign_id) or jg_is_gm(campaign_id));

-- Une seule policy pour écrire : il faut être le MJ de la campagne ET
-- l'auteur enregistré, ce qui interdit à un joueur d'écrire au nom du MJ
-- comme au MJ d'usurper un autre auteur.
create policy jg_journal_entries_write on public.jg_journal_entries
  for all using (jg_is_gm(campaign_id) and author_id = auth.uid())
  with check (jg_is_gm(campaign_id) and author_id = auth.uid());

-- Notes personnelles : exclusives à qui les écrit, y compris (à l'origine)
-- vis-à-vis du MJ. Aucune policy « MJ » ici, volontairement — ce ne sont
-- pas des fiches.
create table public.jg_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  title text check (title is null or char_length(title) <= 160),
  body text not null check (char_length(body) >= 1 and char_length(body) <= 12000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jg_notes enable row level security;

create trigger jg_notes_version
  before update on public.jg_notes
  for each row execute function jg_bump_version();

create policy jg_notes_owner on public.jg_notes
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and jg_is_member(campaign_id));

alter publication supabase_realtime add table public.jg_journal_entries;
alter publication supabase_realtime add table public.jg_notes;
