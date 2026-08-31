-- Le temps réel oubliait les suppressions.
--
-- Le transport (`sync/supabase-transport.ts`) filtre chaque canal Realtime
-- par `campaign_id=eq.<id>` — pour une suppression, Postgres ne fournit que
-- l'ancienne ligne (`old`), et par défaut (REPLICA IDENTITY DEFAULT) cette
-- ancienne ligne ne contient QUE la clé primaire, jamais `campaign_id`.
-- Le filtre ne trouve donc jamais de quoi se satisfaire, et l'événement de
-- suppression n'est tout simplement jamais envoyé aux autres clients — ils
-- continuent de voir un message, une entrée de journal ou un relais de don
-- déjà effacé, jusqu'à ce qu'une reconnexion force une relecture complète.
--
-- REPLICA IDENTITY FULL fait porter la ligne entière (avant modification)
-- dans l'événement, y compris `campaign_id` : le filtre peut alors faire son
-- travail, et la suppression arrive en direct comme le reste.
alter table public.jg_sheets replica identity full;
alter table public.jg_encounters replica identity full;
alter table public.jg_encounter_templates replica identity full;
alter table public.jg_journal_entries replica identity full;
alter table public.jg_notes replica identity full;
alter table public.jg_messages replica identity full;
alter table public.jg_item_transfers replica identity full;
