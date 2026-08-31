-- ═══════════════════════════════════════════════════════════════════════
-- Notifications push : une entrée de journal, un message privé ou un
-- secret prévient sur le téléphone, même l'appli fermée.
--
-- Le navigateur détient la souscription (`endpoint`, deux clés) ; c'est
-- elle qui identifie CET appareil pour l'envoi, jamais un simple numéro de
-- téléphone qu'on ne stocke nulle part. Un même compte peut avoir plusieurs
-- souscriptions (plusieurs appareils) ; en perdre une (désinstallation,
-- abonnement révoqué) ne doit jamais faire échouer les autres — c'est la
-- fonction Edge `send-push` qui nettoie celles qui ne répondent plus.
--
-- L'appel part d'un déclencheur SQL vers la fonction Edge `send-push`, via
-- pg_net (POST asynchrone, ne bloque jamais l'insertion qui l'a déclenché).
-- La fonction Edge n'a pas de jeton utilisateur à vérifier — l'appel vient
-- de la base, pas d'un navigateur — elle authentifie donc la requête avec
-- un secret partagé plutôt qu'un JWT (`verify_jwt: false` au déploiement).
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pg_net;

create table public.jg_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table public.jg_push_subscriptions enable row level security;

-- Chacun ne gère que ses propres appareils — ni la RLS ni l'app n'ont
-- besoin de voir les souscriptions des autres. La fonction Edge, elle, lit
-- avec la clé de service : elle passe par-dessus cette policy, comme pour
-- toute table protégée par RLS.
create policy jg_push_subscriptions_owner on public.jg_push_subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Le déclencheur ─────────────────────────────────────────────────────

create or replace function jg_appeler_push(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://zcjadwqggovlznnlhyzl.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-jg-secret', 'mCAT19wei4Q_EHTNXdnkkUVd2Fq2XFC-Zf1zMANUaHc'
    ),
    body := payload
  );
end;
$$;

create or replace function jg_notify_journal_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform jg_appeler_push(jsonb_build_object(
    'type', 'journal',
    'campaign_id', NEW.campaign_id,
    'author_id', NEW.author_id,
    'title', NEW.title,
    'body', NEW.body
  ));
  return NEW;
end;
$$;

create trigger jg_journal_entries_push
  after insert on public.jg_journal_entries
  for each row execute function jg_notify_journal_entry();

create or replace function jg_notify_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform jg_appeler_push(jsonb_build_object(
    'type', 'message',
    'campaign_id', NEW.campaign_id,
    'author_id', NEW.author_id,
    'recipient_id', NEW.recipient_id,
    'kind', NEW.kind,
    'body', NEW.body
  ));
  return NEW;
end;
$$;

create trigger jg_messages_push
  after insert on public.jg_messages
  for each row execute function jg_notify_message();
