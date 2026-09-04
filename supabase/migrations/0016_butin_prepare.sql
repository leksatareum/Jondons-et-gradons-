-- Le butin d'une rencontre préparée.
--
-- Composer un butin en pleine séance, c'est chercher dans 356 objets pendant
-- que la table attend. Or il se décide au même moment que la rencontre : on
-- sait ce que garde le chef gobelin quand on décide qu'il y a un chef
-- gobelin. Cette colonne le range donc AVEC la rencontre, pour n'avoir plus
-- qu'à le distribuer une fois le combat fini.
--
-- La forme : { "objets": [{ id, clef?, nom, qty, catalogId? }], "or": 0 }.
--
-- `nom` et `catalogId` sont copiés, pas référencés — une rencontre préparée
-- il y a trois mois ne doit pas se vider parce qu'un identifiant du catalogue
-- a changé, et le MJ doit pouvoir y mettre « la clé de la cave », que le livre
-- ne connaît pas.
--
-- Valeur par défaut plutôt que NULL : le code lit toujours une forme, jamais
-- une absence (voir `lireButin`, qui redresse de toute façon ce qu'il reçoit).
alter table public.jg_encounter_templates
  add column if not exists butin jsonb not null default '{"objets": [], "or": 0}'::jsonb;
