-- ═══════════════════════════════════════════════════════════════════════
-- La montée de niveau : le MJ ouvre la porte, le joueur choisit derrière.
--
-- Jusqu'ici (0005), seul le MJ pouvait écrire un changement de niveau —
-- cohérent avec l'écran d'alors, où c'était lui qui remplissait la fenêtre
-- de choix (jet de vie, sous-classe, don ou augmentation…) à la place du
-- joueur. Ce n'est pas la bonne main : ces choix appartiennent au joueur.
--
-- Le MJ garde la seule décision qui est vraiment la sienne — QUAND une
-- montée de niveau est possible — via `live.levelUpUnlocked` sur la fiche.
-- Le joueur choisit ensuite ce que la règle lui laisse choisir, et referme
-- la porte en même temps qu'il monte de niveau.
--
-- Le déclencheur ferme la boucle à l'endroit où elle compte : un joueur ne
-- peut ni s'auto-autoriser (passer `levelUpUnlocked` de faux à vrai lui-même),
-- ni changer son niveau tant que le MJ ne l'a pas fait passer à vrai en
-- premier. Le MJ, lui, reste libre en toute circonstance.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function jg_block_player_level_up() returns trigger as $$
declare
  ancien_deverrouille boolean := coalesce((old.data->'live'->>'levelUpUnlocked')::boolean, false);
  nouveau_deverrouille boolean := coalesce((new.data->'live'->>'levelUpUnlocked')::boolean, false);
begin
  if jg_is_gm(new.campaign_id) then
    return new;
  end if;

  if nouveau_deverrouille and not ancien_deverrouille then
    raise exception 'Seul le MJ peut autoriser une montée de niveau.';
  end if;

  if (old.data->'classLevels') is distinct from (new.data->'classLevels')
     and not ancien_deverrouille then
    raise exception 'Seul le MJ peut faire monter un personnage de niveau.';
  end if;

  return new;
end;
$$ language plpgsql;
