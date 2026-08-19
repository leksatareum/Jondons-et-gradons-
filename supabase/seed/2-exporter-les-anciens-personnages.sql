-- ═══════════════════════════════════════════════════════════════════════
-- Export des personnages de l'ANCIENNE application, pour les importer.
--
-- Lecture seule : ne touche à rien. La table `characters` appartient à
-- `table-connectee`, qui continue de tourner.
--
-- Le résultat est un seul champ JSON. Copie-le entièrement : la conversion
-- vers le nouveau modèle se fait hors de la base, parce qu'elle applique les
-- règles du Manuel (sorts toujours préparés, quotas, ressources) et que ces
-- règles vivent dans le code, testées, pas dans une requête SQL.
-- ═══════════════════════════════════════════════════════════════════════

select json_agg(c order by c.id)::text as personnages
from public.characters c;
