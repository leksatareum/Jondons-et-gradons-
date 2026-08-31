-- ═══════════════════════════════════════════════════════════════════════
-- Chapitres : le journal et les notes personnelles se regroupent
-- maintenant par chapitre nommé à la main (« Valbrume », « La dent
-- cassée »…), plutôt que dans une seule liste chronologique.
--
-- Un simple texte libre, pas une table à part : le chapitre est une
-- étiquette posée par l'auteur, pas une entité qui a sa propre vie
-- (dates de début/fin, description…). Vide, une entrée reste dans le
-- registre général — jamais orpheline, jamais bloquée en attendant qu'on
-- lui choisisse un chapitre.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.jg_journal_entries add column chapter text check (chapter is null or char_length(chapter) <= 80);
alter table public.jg_notes add column chapter text check (chapter is null or char_length(chapter) <= 80);
