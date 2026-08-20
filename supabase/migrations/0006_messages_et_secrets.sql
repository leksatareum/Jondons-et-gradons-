-- ═══════════════════════════════════════════════════════════════════════
-- Messages privés et secrets.
--
-- Une seule table pour les deux : même forme (un auteur, un destinataire,
-- un corps, une date), seuls diffèrent qui a le droit d'écrire et comment
-- ça s'affiche. Un secret est un message que seul le MJ peut envoyer et
-- auquel on ne répond pas — c'est ce que `kind` retient, et rien d'autre
-- ne change. Deux tables auraient dupliqué la RLS, le dépôt versionné et
-- les mutations pour cette seule nuance.
-- ═══════════════════════════════════════════════════════════════════════

create table public.jg_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.jg_campaigns(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  recipient_id uuid not null references auth.users(id),
  kind text not null default 'message' check (kind in ('message', 'secret')),
  body text not null check (char_length(body) >= 1 and char_length(body) <= 12000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jg_messages enable row level security;

create trigger jg_messages_version
  before update on public.jg_messages
  for each row execute function jg_bump_version();

-- Lecture : l'auteur, le destinataire, et le MJ — qui garde un œil sur toute
-- sa table (même règle que pour les notes, migration 0004).
create policy jg_messages_read on public.jg_messages
  for select using (
    author_id = auth.uid() or recipient_id = auth.uid() or jg_is_gm(campaign_id)
  );

-- Écriture : on signe toujours de son propre nom, et on doit appartenir à la
-- campagne. Un secret exige d'être le MJ — un joueur ne s'envoie pas de
-- révélation à lui-même.
create policy jg_messages_write on public.jg_messages
  for insert with check (
    author_id = auth.uid()
    and (jg_is_member(campaign_id) or jg_is_gm(campaign_id))
    and (kind = 'message' or jg_is_gm(campaign_id))
  );

-- On efface ce qu'on a écrit, jamais ce qu'on a reçu : sinon le destinataire
-- ferait disparaître la preuve d'une conversation de la boîte de l'autre.
create policy jg_messages_delete on public.jg_messages
  for delete using (author_id = auth.uid());

alter publication supabase_realtime add table public.jg_messages;
