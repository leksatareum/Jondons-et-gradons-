import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ENCOUNTER_TEMPLATES_TABLE, ENCOUNTERS_TABLE, JOURNAL_TABLE, MESSAGES_TABLE, NOTES_TABLE, SHEETS_TABLE,
  type CampaignSync,
} from './campaign-sync';
import type { SyncRow } from './supabase-transport';
import type { SouscriptionPush } from '../notifications/push';
import type { CharacterSheet } from '../model/character';
import type { Combatant, EncounterState } from '../domain/encounter';

/**
 * Les écritures.
 *
 * Deux règles, tenues par le typage plutôt que par la discipline :
 *
 * 1. **Le client n'envoie jamais `version`.** C'est le déclencheur
 *    `jg_bump_version` qui l'incrémente. Deux clients qui calculeraient leur
 *    propre version se marcheraient dessus sans que personne s'en aperçoive.
 * 2. **Toute écriture renvoie sa ligne** (`.select().single()`) et la réinjecte
 *    dans la synchronisation. L'auteur voit son geste immédiatement, sans
 *    attendre l'écho du canal, et sans mentir sur l'état : la ligne vient de
 *    la base.
 */

export class WriteError extends Error {
  constructor(readonly table: string, message: string) {
    super(`${table} : ${message}`);
    this.name = 'WriteError';
  }
}

/** Écrit un champ jsonb et réinjecte la ligne renvoyée. */
async function writeRow(
  client: SupabaseClient,
  sync: CampaignSync | null,
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<SyncRow> {
  const { data, error } = await client
    .from(table)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new WriteError(table, error.message);
  // Une mise à jour filtrée par la RLS ne renvoie aucune ligne sans lever
  // d'erreur : un joueur qui tenterait la fiche d'un autre partirait sinon
  // avec l'illusion d'avoir écrit.
  if (!data) throw new WriteError(table, 'écriture refusée ou ligne introuvable');
  const row = data as SyncRow;
  sync?.ingest(table, row);
  return row;
}

export const saveSheet = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
  sheet: CharacterSheet,
): Promise<SyncRow> => writeRow(client, sync, SHEETS_TABLE, id, { data: sheet });

export const saveEncounter = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
  state: EncounterState,
): Promise<SyncRow> => writeRow(client, sync, ENCOUNTERS_TABLE, id, { state });

/**
 * Supprime une ligne et réinjecte l'absence dans la synchronisation.
 *
 * `.select().single()` sur un `delete` renvoie la ligne telle qu'elle était
 * juste avant sa suppression : c'est ce qui donne sa version à
 * `ingestDelete`, sans quoi l'auteur de la suppression attendrait l'écho du
 * canal pour la voir disparaître de son propre écran.
 */
async function deleteRow(
  client: SupabaseClient,
  sync: CampaignSync | null,
  table: string,
  id: string,
): Promise<void> {
  const { data, error } = await client.from(table).delete().eq('id', id).select().single();
  if (error) throw new WriteError(table, error.message);
  if (!data) throw new WriteError(table, 'suppression refusée ou ligne introuvable');
  const row = data as SyncRow;
  sync?.ingestDelete(table, row.id, row.version);
}

/**
 * Le journal : public, mais seul le MJ y écrit — la RLS le rappelle à qui
 * l'oublierait, cet écran ne fait que proposer ce qu'elle autorise.
 */
export async function createJournalEntry(
  client: SupabaseClient,
  sync: CampaignSync | null,
  campaignId: string,
  authorId: string,
  entry: { title?: string | null; chapter?: string | null; body: string },
): Promise<SyncRow> {
  const { data, error } = await client
    .from(JOURNAL_TABLE)
    .insert({
      campaign_id: campaignId, author_id: authorId,
      title: entry.title ?? null, chapter: entry.chapter ?? null, body: entry.body,
    })
    .select()
    .single();
  if (error) throw new WriteError(JOURNAL_TABLE, error.message);
  if (!data) throw new WriteError(JOURNAL_TABLE, 'création refusée');
  const row = data as SyncRow;
  sync?.ingest(JOURNAL_TABLE, row);
  return row;
}

export const saveJournalEntry = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
  entry: { title?: string | null; chapter?: string | null; body: string },
): Promise<SyncRow> => writeRow(client, sync, JOURNAL_TABLE, id, entry);

export const deleteJournalEntry = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
): Promise<void> => deleteRow(client, sync, JOURNAL_TABLE, id);

/**
 * Les notes : personnelles à l'écriture (RLS `owner_id = auth.uid()`), mais
 * lisibles du MJ (`jg_is_gm(campaign_id)`, policy additive) — jamais des
 * autres joueurs. Ces fonctions ne font que solliciter la RLS dans le bon sens.
 */
export async function createNote(
  client: SupabaseClient,
  sync: CampaignSync | null,
  campaignId: string,
  ownerId: string,
  note: { title?: string | null; chapter?: string | null; body: string },
): Promise<SyncRow> {
  const { data, error } = await client
    .from(NOTES_TABLE)
    .insert({
      campaign_id: campaignId, owner_id: ownerId,
      title: note.title ?? null, chapter: note.chapter ?? null, body: note.body,
    })
    .select()
    .single();
  if (error) throw new WriteError(NOTES_TABLE, error.message);
  if (!data) throw new WriteError(NOTES_TABLE, 'création refusée');
  const row = data as SyncRow;
  sync?.ingest(NOTES_TABLE, row);
  return row;
}

export const saveNote = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
  note: { title?: string | null; chapter?: string | null; body: string },
): Promise<SyncRow> => writeRow(client, sync, NOTES_TABLE, id, note);

export const deleteNote = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
): Promise<void> => deleteRow(client, sync, NOTES_TABLE, id);

/**
 * Un message privé, ou un secret quand `kind` le dit — la RLS n'accepte
 * `'secret'` que du MJ, cette fonction ne fait que transmettre l'intention.
 */
export async function createMessage(
  client: SupabaseClient,
  sync: CampaignSync | null,
  campaignId: string,
  authorId: string,
  message: { recipientId: string; body: string; kind?: 'message' | 'secret' },
): Promise<SyncRow> {
  const { data, error } = await client
    .from(MESSAGES_TABLE)
    .insert({
      campaign_id: campaignId,
      author_id: authorId,
      recipient_id: message.recipientId,
      kind: message.kind ?? 'message',
      body: message.body,
    })
    .select()
    .single();
  if (error) throw new WriteError(MESSAGES_TABLE, error.message);
  if (!data) throw new WriteError(MESSAGES_TABLE, 'envoi refusé');
  const row = data as SyncRow;
  sync?.ingest(MESSAGES_TABLE, row);
  return row;
}

/** On efface ce qu'on a écrit, jamais ce qu'on a reçu — la RLS y veille. */
export const deleteMessage = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
): Promise<void> => deleteRow(client, sync, MESSAGES_TABLE, id);

export async function createEncounter(
  client: SupabaseClient,
  sync: CampaignSync | null,
  campaignId: string,
  state: EncounterState,
): Promise<SyncRow> {
  const { data, error } = await client
    .from(ENCOUNTERS_TABLE)
    .insert({ campaign_id: campaignId, state })
    .select()
    .single();
  if (error) throw new WriteError(ENCOUNTERS_TABLE, error.message);
  if (!data) throw new WriteError(ENCOUNTERS_TABLE, 'création refusée');
  const row = data as SyncRow;
  sync?.ingest(ENCOUNTERS_TABLE, row);
  return row;
}

/**
 * Rencontres préparées à l'avance : un nom et un sac de créatures, jamais lus
 * par un joueur (RLS `jg_encounter_templates_all`, MJ seulement). Les
 * déclencher revient à copier leurs créatures dans la rencontre en cours
 * (voir `addCombatants`, src/domain/encounter.ts) — cette table-ci n'est
 * jamais elle-même « la » rencontre.
 */
export async function createEncounterTemplate(
  client: SupabaseClient,
  sync: CampaignSync | null,
  campaignId: string,
  name: string,
  combatants: Combatant[],
): Promise<SyncRow> {
  const { data, error } = await client
    .from(ENCOUNTER_TEMPLATES_TABLE)
    .insert({ campaign_id: campaignId, name, combatants })
    .select()
    .single();
  if (error) throw new WriteError(ENCOUNTER_TEMPLATES_TABLE, error.message);
  if (!data) throw new WriteError(ENCOUNTER_TEMPLATES_TABLE, 'création refusée');
  const row = data as SyncRow;
  sync?.ingest(ENCOUNTER_TEMPLATES_TABLE, row);
  return row;
}

export const saveEncounterTemplate = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
  patch: { name?: string; combatants?: Combatant[] },
): Promise<SyncRow> => writeRow(client, sync, ENCOUNTER_TEMPLATES_TABLE, id, patch);

export const deleteEncounterTemplate = (
  client: SupabaseClient,
  sync: CampaignSync | null,
  id: string,
): Promise<void> => deleteRow(client, sync, ENCOUNTER_TEMPLATES_TABLE, id);

const PUSH_SUBSCRIPTIONS_TABLE = 'jg_push_subscriptions';

/**
 * Souscriptions push : à part du reste — pas de `version`, pas de canal
 * temps réel, jamais lues par un écran (voir `notifications/push.ts` et la
 * fonction Edge `send-push`, seule à les consulter). `upsert` sur
 * `endpoint` : un appareil qui redemande la permission remplace sa ligne au
 * lieu d'en empiler une seconde identique.
 */
export async function savePushSubscription(
  client: SupabaseClient,
  userId: string,
  souscription: SouscriptionPush,
): Promise<void> {
  const { error } = await client
    .from(PUSH_SUBSCRIPTIONS_TABLE)
    .upsert(
      { user_id: userId, endpoint: souscription.endpoint, p256dh: souscription.p256dh, auth_key: souscription.authKey },
      { onConflict: 'endpoint' },
    );
  if (error) throw new WriteError(PUSH_SUBSCRIPTIONS_TABLE, error.message);
}

export async function deletePushSubscription(client: SupabaseClient, endpoint: string): Promise<void> {
  const { error } = await client.from(PUSH_SUBSCRIPTIONS_TABLE).delete().eq('endpoint', endpoint);
  if (error) throw new WriteError(PUSH_SUBSCRIPTIONS_TABLE, error.message);
}
