-- ═══════════════════════════════════════════════════════════════════════
-- Règles d'accès (RLS).
--
-- Le partage de règles : on est membre d'une campagne ou on ne voit rien.
-- À l'intérieur, la ligne de partage est celle de la table réelle :
--
--  · tout le monde LIT tout — les joueurs voient les fiches du groupe, c'est
--    la moitié de l'intérêt d'une app connectée ;
--  · un joueur n'ÉCRIT que sa propre fiche ;
--  · le MJ écrit toutes les fiches de SA campagne, parce qu'il applique les
--    dégâts et les états, et attendre que chaque joueur les saisisse
--    lui-même est exactement la lourdeur qu'on cherche à supprimer ;
--  · seul le MJ écrit la rencontre : c'est lui, et lui seul, qui lance le
--    tour par tour.
--
-- Les fonctions d'appartenance sont en SECURITY DEFINER : sans cela, une
-- politique sur `jg_members` qui interroge `jg_members` boucle à l'infini.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.jg_is_member(campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jg_members
    where campaign_id = campaign and user_id = auth.uid()
  );
$$;

create or replace function public.jg_is_gm(campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jg_campaigns
    where id = campaign and gm_id = auth.uid()
  );
$$;

alter table public.jg_campaigns enable row level security;
alter table public.jg_members   enable row level security;
alter table public.jg_sheets    enable row level security;
alter table public.jg_encounters enable row level security;

-- ─── Campagnes ────────────────────────────────────────────────────────

drop policy if exists jg_campaigns_read on public.jg_campaigns;
create policy jg_campaigns_read on public.jg_campaigns
  for select using (public.jg_is_member(id) or gm_id = auth.uid());

drop policy if exists jg_campaigns_create on public.jg_campaigns;
create policy jg_campaigns_create on public.jg_campaigns
  for insert with check (gm_id = auth.uid());

drop policy if exists jg_campaigns_write on public.jg_campaigns;
create policy jg_campaigns_write on public.jg_campaigns
  for update using (gm_id = auth.uid()) with check (gm_id = auth.uid());

-- ─── Participants ─────────────────────────────────────────────────────

drop policy if exists jg_members_read on public.jg_members;
create policy jg_members_read on public.jg_members
  for select using (user_id = auth.uid() or public.jg_is_gm(campaign_id));

-- Seul le MJ enrôle : sinon n'importe qui s'ajouterait à n'importe quelle
-- campagne et gagnerait la lecture de toutes ses fiches.
drop policy if exists jg_members_write on public.jg_members;
create policy jg_members_write on public.jg_members
  for all using (public.jg_is_gm(campaign_id)) with check (public.jg_is_gm(campaign_id));

-- ─── Fiches ───────────────────────────────────────────────────────────

drop policy if exists jg_sheets_read on public.jg_sheets;
create policy jg_sheets_read on public.jg_sheets
  for select using (public.jg_is_member(campaign_id) or public.jg_is_gm(campaign_id));

drop policy if exists jg_sheets_create on public.jg_sheets;
create policy jg_sheets_create on public.jg_sheets
  for insert with check (
    (owner_id = auth.uid() and public.jg_is_member(campaign_id))
    or public.jg_is_gm(campaign_id)
  );

drop policy if exists jg_sheets_update on public.jg_sheets;
create policy jg_sheets_update on public.jg_sheets
  for update
  using (owner_id = auth.uid() or public.jg_is_gm(campaign_id))
  with check (owner_id = auth.uid() or public.jg_is_gm(campaign_id));

drop policy if exists jg_sheets_delete on public.jg_sheets;
create policy jg_sheets_delete on public.jg_sheets
  for delete using (owner_id = auth.uid() or public.jg_is_gm(campaign_id));

-- ─── Rencontres ───────────────────────────────────────────────────────

drop policy if exists jg_encounters_read on public.jg_encounters;
create policy jg_encounters_read on public.jg_encounters
  for select using (public.jg_is_member(campaign_id) or public.jg_is_gm(campaign_id));

drop policy if exists jg_encounters_write on public.jg_encounters;
create policy jg_encounters_write on public.jg_encounters
  for all using (public.jg_is_gm(campaign_id)) with check (public.jg_is_gm(campaign_id));

-- ─── Temps réel ───────────────────────────────────────────────────────
-- Sans cette publication, aucun événement n'est émis et l'app retombe
-- silencieusement sur la seule resynchronisation — soit exactement la panne
-- de l'ancienne application.

-- Rejouable : `add table` sur une table déjà publiée est une erreur, pas un
-- no-op. Sans le test d'appartenance, une deuxième exécution de ce fichier
-- échoue — et une migration qu'on ne peut pas rejouer est une migration qu'on
-- n'ose plus lancer sur la production.

do $$
declare
  cible text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach cible in array array['jg_sheets', 'jg_encounters'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = cible
    ) then
      execute format('alter publication supabase_realtime add table public.%I', cible);
    end if;
  end loop;
end;
$$;
