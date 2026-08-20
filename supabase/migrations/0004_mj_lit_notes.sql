-- ═══════════════════════════════════════════════════════════════════════
-- Le MJ garde un œil sur toute sa table : il lit les notes de ses joueurs.
--
-- Policy additive à `jg_notes_owner` (0003) — l'écriture reste réservée au
-- propriétaire, seule la lecture s'ouvre en plus au MJ. Le journal était
-- déjà lisible par tous, rien à changer là.
-- ═══════════════════════════════════════════════════════════════════════

create policy jg_notes_gm_read on public.jg_notes
  for select using (jg_is_gm(campaign_id));
