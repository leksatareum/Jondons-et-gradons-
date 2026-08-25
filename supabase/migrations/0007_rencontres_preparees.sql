-- ═══════════════════════════════════════════════════════════════════════
-- Rencontres préparées à l'avance.
--
-- Distinctes de `jg_encounters` (la rencontre EN COURS, que les joueurs
-- voient) : une rencontre préparée est un simple sac de créatures, sans
-- initiative ni tour, que le MJ compose avant la table et déclenche d'un
-- geste le moment venu. Une table séparée plutôt qu'un statut de plus sur
-- `jg_encounters` : les joueurs n'ont RIEN à en voir avant qu'elle ne
-- devienne la rencontre en cours, alors que `jg_encounters` leur est déjà
-- lisible en RLS — mélanger les deux aurait éventé la surprise d'une
-- embuscade tant que le MJ compose sa liste.
-- ═══════════════════════════════════════════════════════════════════════

create table public.jg_encounter_templates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  name text not null check (char_length(name) >= 1 and char_length(name) <= 200),
  -- Un tableau de `Combatant` (src/domain/encounter.ts), toujours côté
  -- créature : la partie des joueurs rejoint la rencontre en cours d'elle-
  -- même (`withParty`), pas depuis une rencontre préparée.
  combatants jsonb not null default '[]'::jsonb check (jsonb_typeof(combatants) = 'array'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (octet_length(combatants::text) <= 262144)
);

create index jg_encounter_templates_campaign_idx on public.jg_encounter_templates (campaign_id);

alter table public.jg_encounter_templates enable row level security;

create trigger jg_encounter_templates_version
  before update on public.jg_encounter_templates
  for each row execute function public.jg_bump_version();

-- Le MJ seul, dans les deux sens : ni lecture ni écriture pour un joueur —
-- une rencontre préparée est un secret de table tant qu'elle n'est pas
-- déclenchée.
create policy jg_encounter_templates_all on public.jg_encounter_templates
  for all using (public.jg_is_gm(campaign_id)) with check (public.jg_is_gm(campaign_id));

alter publication supabase_realtime add table public.jg_encounter_templates;
