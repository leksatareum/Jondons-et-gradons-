-- ═══════════════════════════════════════════════════════════════════════
-- Seul le MJ accorde un repos.
--
-- `RestScreen` désactive déjà le bouton pour un joueur (`estMj`), mais rien
-- n'empêchait d'écrire directement le résultat d'un repos — outils de dev,
-- requête REST à la main — puisque la RLS `jg_sheets_update` autorise le
-- propriétaire à écrire toute sa fiche. Même trou que la montée de niveau
-- (0005), même correctif : un déclencheur qui ferme la porte au niveau où
-- elle compte, quel que soit l'écran.
--
-- La difficulté propre au repos : `restoreResource` (le pisteur de
-- ressources de l'écran de combat) rend LÉGITIMEMENT une unité à la fois —
-- un joueur corrige un clic de trop, ou une capacité rend un emplacement
-- ponctuellement. Un vrai repos, lui, remet PLUSIEURS choses à zéro EN UNE
-- seule écriture (`model/rest.ts`) : c'est cette remise à zéro groupée, pas
-- une simple baisse, qui distingue un repos auto-octroyé d'une correction
-- légitime.
--
-- Trois signaux, chacun sans faux positif contre `restoreResource` :
--  - les dés de vie dépensés ne reviennent QUE par un repos long (jamais
--    par aucun autre geste du joueur) : toute baisse du total est bloquée ;
--  - plus d'un rang d'emplacement de sort qui baisse à la fois, ou un rang
--    qui baisse de plus d'un cran — `restoreResource` n'en baisse qu'un, de
--    exactement un ;
--  - même logique pour les emplacements de pacte et pour les ressources
--    nommées (Forme sauvage…) : plus d'une qui baisse à la fois est un
--    repos, jamais une correction ponctuelle.
--
-- `jg_is_gm` est SECURITY DEFINER (0002) : elle voit juste sous la RLS,
-- inutile que cette fonction le soit aussi.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function jg_sum_jsonb_numbers(objet jsonb) returns numeric as $$
  select coalesce(sum(value::numeric), 0) from jsonb_each_text(coalesce(objet, '{}'::jsonb));
$$ language sql immutable;

-- Nombre de clés dont la valeur a BAISSÉ entre les deux objets — une clé
-- absente du second objet compte comme retombée à zéro.
create or replace function jg_count_decreased_keys(ancien jsonb, nouveau jsonb) returns integer as $$
declare
  cle text;
  total integer := 0;
begin
  for cle in select jsonb_object_keys(coalesce(ancien, '{}'::jsonb)) loop
    if coalesce((nouveau->>cle)::numeric, 0) < coalesce((ancien->>cle)::numeric, 0) then
      total := total + 1;
    end if;
  end loop;
  return total;
end;
$$ language plpgsql immutable;

create or replace function jg_block_player_rest() returns trigger as $$
declare
  ancien_live jsonb := old.data->'live';
  nouveau_live jsonb := new.data->'live';
  des_ancien numeric := jg_sum_jsonb_numbers(ancien_live->'hitDiceSpent');
  des_nouveau numeric := jg_sum_jsonb_numbers(nouveau_live->'hitDiceSpent');
  emplacements_ancien numeric := jg_sum_jsonb_numbers(ancien_live->'spellSlotsSpent');
  emplacements_nouveau numeric := jg_sum_jsonb_numbers(nouveau_live->'spellSlotsSpent');
  rangs_baisses integer := jg_count_decreased_keys(ancien_live->'spellSlotsSpent', nouveau_live->'spellSlotsSpent');
  pacte_ancien numeric := coalesce((ancien_live->>'pactSlotsSpent')::numeric, 0);
  pacte_nouveau numeric := coalesce((nouveau_live->>'pactSlotsSpent')::numeric, 0);
  ressources_baissees integer := jg_count_decreased_keys(ancien_live->'resourcesSpent', nouveau_live->'resourcesSpent');
begin
  if jg_is_gm(new.campaign_id) then
    return new;
  end if;

  if des_nouveau < des_ancien then
    raise exception 'Seul le MJ peut accorder un repos.';
  end if;

  if rangs_baisses > 1 or (rangs_baisses = 1 and (emplacements_ancien - emplacements_nouveau) > 1) then
    raise exception 'Seul le MJ peut accorder un repos.';
  end if;

  if (pacte_ancien - pacte_nouveau) > 1 then
    raise exception 'Seul le MJ peut accorder un repos.';
  end if;

  if ressources_baissees > 1 then
    raise exception 'Seul le MJ peut accorder un repos.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger jg_sheets_no_self_rest
  before update on public.jg_sheets
  for each row execute function jg_block_player_rest();
