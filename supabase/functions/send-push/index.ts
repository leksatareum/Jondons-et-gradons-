// Notifications push : une entrée de journal, un message privé ou un secret
// prévient sur le téléphone, même l'appli fermée.
//
// Appelée par le déclencheur SQL `jg_appeler_push` (migration
// 0012_notifications_push.sql), jamais directement par un navigateur — d'où
// une authentification par secret partagé plutôt que par jeton utilisateur
// (`verify_jwt: false` au déploiement, header `x-jg-secret` vérifié ici).
//
// Les clés VAPID sont publiques par construction pour la moitié « publique »
// (voir `src/notifications/push.ts`, commentée pareil) ; seule la moitié
// privée doit rester ici, jamais dans le dépôt client.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SECRET_PARTAGE = 'mCAT19wei4Q_EHTNXdnkkUVd2Fq2XFC-Zf1zMANUaHc';
const VAPID_PUBLIC_KEY = 'BMbUdvw3uNb6RkKRS6ixhfpJ5BV1M26QQjnXgHN85jTtXRypRYdH9PUCVoVagNPw5Syzr7ZYP6dlL6tPAet9dVM';
const VAPID_PRIVATE_KEY = 'yNznq-ZbKQ67-9XtMAaBzSQfiWb4Cu9ePj_BTLAgiuM';

webpush.setVapidDetails('mailto:jondons-et-gradons@protonmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  // La clé de service : elle passe par-dessus la RLS, comme toute tâche de
  // fond qui doit lire les souscriptions de quelqu'un d'autre que soi.
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

type Evenement = {
  type: 'journal' | 'message';
  campaign_id: string;
  author_id: string;
  recipient_id?: string;
  kind?: 'message' | 'secret';
  title?: string | null;
  body?: string;
};

/** Le nom sous lequel on connaît quelqu'un à cette table — jamais son UUID. */
async function nomDe(userId: string, campaignId: string, gmId: string | undefined): Promise<string> {
  if (gmId === userId) return 'le MJ';
  const { data } = await supabase
    .from('jg_sheets')
    .select('data')
    .eq('campaign_id', campaignId)
    .eq('owner_id', userId)
    .maybeSingle();
  const nom = (data?.data as { name?: string } | null)?.name;
  return nom || 'quelqu’un';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('méthode non supportée', { status: 405 });
  if (req.headers.get('x-jg-secret') !== SECRET_PARTAGE) return new Response('non autorisé', { status: 401 });

  const evt = (await req.json().catch(() => null)) as Evenement | null;
  if (!evt?.type || !evt.campaign_id || !evt.author_id) {
    return new Response('payload invalide', { status: 400 });
  }

  const { data: campagne } = await supabase
    .from('jg_campaigns')
    .select('name, gm_id')
    .eq('id', evt.campaign_id)
    .maybeSingle();
  const nomCampagne = campagne?.name ?? 'ta campagne';

  let destinataires: string[] = [];
  let titre = '';
  let corps = '';

  if (evt.type === 'journal') {
    const { data: membres } = await supabase
      .from('jg_members')
      .select('user_id')
      .eq('campaign_id', evt.campaign_id);
    destinataires = (membres ?? [])
      .map((m: { user_id: string }) => m.user_id)
      .filter((id) => id !== evt.author_id);
    const auteur = await nomDe(evt.author_id, evt.campaign_id, campagne?.gm_id);
    titre = `Journal · ${nomCampagne}`;
    corps = evt.title ? `${auteur} : ${evt.title}` : `${auteur} a ajouté une entrée.`;
  } else if (evt.type === 'message') {
    if (evt.recipient_id) destinataires = [evt.recipient_id];
    const auteur = await nomDe(evt.author_id, evt.campaign_id, campagne?.gm_id);
    if (evt.kind === 'secret') {
      titre = `Secret · ${nomCampagne}`;
      corps = `${auteur} t’a confié un secret.`;
    } else {
      titre = `Message · ${nomCampagne}`;
      corps = `${auteur} : ${String(evt.body ?? '').slice(0, 120)}`;
    }
  } else {
    return new Response('type inconnu', { status: 400 });
  }

  if (destinataires.length === 0) {
    return new Response(JSON.stringify({ envoyes: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const { data: abonnements } = await supabase
    .from('jg_push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .in('user_id', destinataires);

  const paquet = JSON.stringify({ title: titre, body: corps });

  const resultats = await Promise.allSettled(
    (abonnements ?? []).map(async (abo: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth_key } },
          paquet,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404/410 : l'abonnement n'existe plus côté navigateur (désinstallé,
        // révoqué) — on nettoie plutôt que de retenter indéfiniment dans le vide.
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('jg_push_subscriptions').delete().eq('id', abo.id);
        } else {
          throw err;
        }
      }
    }),
  );

  return new Response(
    JSON.stringify({ envoyes: resultats.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
