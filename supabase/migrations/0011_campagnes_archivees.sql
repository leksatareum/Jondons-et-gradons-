-- Une campagne « archivée » reste entière — fiches, journal, rencontres —
-- mais disparaît de la liste que chacun voit en se connectant. Jusqu'ici la
-- seule façon de ne plus voir une campagne d'essai était de la supprimer :
-- aucun geste réversible n'existait entre « visible » et « effacée ».
alter table public.jg_campaigns
  add column if not exists archived boolean not null default false;
