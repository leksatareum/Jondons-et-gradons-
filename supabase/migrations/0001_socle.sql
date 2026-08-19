-- ═══════════════════════════════════════════════════════════════════════
-- Socle de « Jondons et gradons ».
--
-- Ces tables cohabitent avec celles de `table-connectee` DANS LE MÊME projet
-- Supabase, sans jamais y toucher : l'ancienne application est gelée mais
-- toujours en service, et une partie s'y joue encore. D'où le préfixe `jg_`,
-- qui garantit l'absence de collision sans exiger de configuration du tableau
-- de bord (un schéma dédié aurait été plus élégant, mais il faut alors
-- l'exposer à l'API à la main).
--
-- Deux principes, hérités du reste du projet :
--
--  · La fiche ne stocke QUE les décisions du joueur. Aucun point de vie
--    maximum, aucune classe d'armure, aucun emplacement de sort ici : tout se
--    dérive à la lecture. C'est ce qui permet à une règle ajoutée demain de
--    s'appliquer rétroactivement, sans migration.
--  · `version` s'incrémente à chaque écriture. Le client s'en sert pour
--    ignorer un événement plus ancien que ce qu'il détient déjà — sans quoi un
--    instantané et un flux temps réel se détruisent mutuellement.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Campagnes et participants ────────────────────────────────────────

create table if not exists public.jg_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  gm_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.jg_members (
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('mj', 'joueur')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create index if not exists jg_members_user_idx on public.jg_members (user_id);

-- ─── Fiches de personnage ─────────────────────────────────────────────

create table if not exists public.jg_sheets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- Le `CharacterSheet` de src/model/character.ts : décisions et état vivant.
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Une fiche complète tient très largement dedans ; la borne protège d'un
  -- client qui enverrait n'importe quoi.
  check (octet_length(data::text) <= 262144)
);

create index if not exists jg_sheets_campaign_idx on public.jg_sheets (campaign_id);

-- ─── Rencontres ───────────────────────────────────────────────────────

create table if not exists public.jg_encounters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  -- L'`EncounterState` de src/domain/encounter.ts. `turn_index = -1` signifie
  -- que le combat n'est pas lancé : c'est cet état, et lui seul, qui met les
  -- écrans des joueurs en tour par tour.
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (octet_length(state::text) <= 262144)
);

create index if not exists jg_encounters_campaign_idx on public.jg_encounters (campaign_id);

-- ─── Incrément de version ─────────────────────────────────────────────
-- Fait côté base, jamais confié au client : deux clients qui écrivent en même
-- temps se marcheraient dessus si chacun calculait sa propre version.

create or replace function public.jg_bump_version()
returns trigger
language plpgsql
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists jg_sheets_version on public.jg_sheets;
create trigger jg_sheets_version
  before update on public.jg_sheets
  for each row execute function public.jg_bump_version();

drop trigger if exists jg_encounters_version on public.jg_encounters;
create trigger jg_encounters_version
  before update on public.jg_encounters
  for each row execute function public.jg_bump_version();
