-- ═══════════════════════════════════════════════════════════════════════
-- Dons d'objets entre joueurs.
--
-- Un joueur ne peut écrire QUE sa propre fiche (`jg_sheets_update`,
-- migration 0002) : il n'a donc aucun moyen d'ajouter directement un objet
-- dans le sac d'un autre. Cette table sert de relais — l'expéditeur retire
-- l'objet de son propre sac (sa propre écriture, déjà permise) et dépose
-- ici ce qu'il envoie ; le destinataire, à la prochaine synchronisation,
-- l'ajoute à SON propre sac (sa propre écriture) et efface la ligne. Aucun
-- des deux n'écrit jamais la fiche de l'autre.
--
-- Pas de rang d'emplacement, pas de statut « accepté » à cocher : un don
-- reçu se glisse dans le sac tout seul, comme un objet qu'on vous tend à
-- la table — le seul geste qui reste au joueur est de vider ce qu'il ne
-- veut pas garder, depuis le Sac lui-même.
-- ═══════════════════════════════════════════════════════════════════════

create table public.jg_item_transfers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  recipient_id uuid not null references auth.users(id),
  item_name text not null check (char_length(item_name) between 1 and 120),
  item_note text check (item_note is null or char_length(item_note) <= 500),
  item_catalog_id text,
  qty integer not null check (qty > 0),
  -- Jamais mise à jour en place (seulement créée puis effacée) : la colonne
  -- existe pour que cette table s'intègre au même transport temps réel que
  -- les autres (`sync/supabase-transport.ts`, `SyncRow` l'exige partout),
  -- pas parce que cette ligne changerait un jour de version.
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now()
);

alter table public.jg_item_transfers enable row level security;

create index jg_item_transfers_recipient_idx on public.jg_item_transfers (recipient_id);

-- Lecture : l'expéditeur, le destinataire, et le MJ qui garde un œil sur sa
-- table — même règle que les messages (migration 0006).
create policy jg_item_transfers_read on public.jg_item_transfers
  for select using (
    sender_id = auth.uid() or recipient_id = auth.uid() or public.jg_is_gm(campaign_id)
  );

-- On signe toujours de son propre nom, et on doit appartenir à la campagne.
create policy jg_item_transfers_insert on public.jg_item_transfers
  for insert with check (sender_id = auth.uid() and public.jg_is_member(campaign_id));

-- Seul le destinataire efface — c'est lui qui consomme le don en l'ajoutant
-- à son sac. L'expéditeur ne revient jamais dessus : l'objet a déjà quitté
-- le sien au moment de l'envoi, comme le donner en vrai à la table.
create policy jg_item_transfers_delete on public.jg_item_transfers
  for delete using (recipient_id = auth.uid() or public.jg_is_gm(campaign_id));

alter publication supabase_realtime add table public.jg_item_transfers;
