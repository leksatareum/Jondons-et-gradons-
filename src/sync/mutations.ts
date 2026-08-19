import type { SupabaseClient } from '@supabase/supabase-js';
import { ENCOUNTERS_TABLE, SHEETS_TABLE, type CampaignSync } from './campaign-sync';
import type { SyncRow } from './supabase-transport';
import type { CharacterSheet } from '../model/character';
import type { EncounterState } from '../domain/encounter';

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
