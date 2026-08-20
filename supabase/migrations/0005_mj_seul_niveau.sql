-- ═══════════════════════════════════════════════════════════════════════
-- Seul le MJ fait monter un personnage de niveau.
--
-- L'écran ne montrait déjà le bouton « Niveau + » qu'au MJ (`estMj` dans
-- SheetView), mais rien n'empêchait un joueur d'écrire directement le
-- changement — outils de dev, requête REST à la main — puisque la RLS
-- `jg_sheets_update` autorise le propriétaire à écrire toute sa fiche.
-- Ce déclencheur ferme cette porte au niveau où elle compte vraiment.
--
-- `jg_is_gm` est SECURITY DEFINER (0002) : elle voit juste sous la RLS,
-- inutile que cette fonction le soit aussi.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function jg_block_player_level_up() returns trigger as $$
begin
  if (old.data->'classLevels') is distinct from (new.data->'classLevels')
     and not jg_is_gm(new.campaign_id) then
    raise exception 'Seul le MJ peut faire monter un personnage de niveau.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger jg_sheets_no_self_levelup
  before update on public.jg_sheets
  for each row execute function jg_block_player_level_up();
