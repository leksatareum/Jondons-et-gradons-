import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { ChannelStatus, SyncTransport } from './connection';
import { VersionedStore, type VersionedRecord } from './versioned-store';

/**
 * Branchement de la synchronisation sur Supabase Realtime.
 *
 * Tout l'intérêt de l'interface `SyncTransport` tient dans une ligne de cette
 * implémentation : le rappel `onStatus` passé à `.subscribe()`. C'est
 * exactement ce que `table-connectee` omettait — son canal était ouvert par un
 * `.subscribe()` nu, sans rappel, et l'application ne pouvait donc jamais
 * savoir qu'elle était déconnectée. Ici, l'oubli est impossible : le contrat
 * l'exige.
 *
 * Le transport ne décide de rien. Il traduit, et c'est tout : la logique de
 * reconnexion, de resynchronisation et de fraîcheur vit dans
 * `SyncConnection`, testée sans réseau.
 */

/** Une ligne telle que Supabase la renvoie pour nos tables versionnées. */
export interface SyncRow extends VersionedRecord {
  id: string;
  version: number;
  [key: string]: unknown;
}

export type SyncEvent =
  | { kind: 'upsert'; table: string; row: SyncRow }
  | { kind: 'delete'; table: string; id: string; version: number };

/**
 * Traduction du statut d'un canal Supabase vers le vocabulaire de la machine.
 * Faite ici, une fois, plutôt que dispersée dans la logique de cycle de vie.
 */
export function toChannelStatus(supabaseStatus: string): ChannelStatus {
  switch (supabaseStatus) {
    case 'SUBSCRIBED': return 'subscribed';
    case 'CHANNEL_ERROR': return 'error';
    case 'TIMED_OUT': return 'timed-out';
    case 'CLOSED': return 'closed';
    // Un statut inconnu est traité comme une erreur : mieux vaut une
    // reconnexion inutile qu'un canal mort qu'on croit vivant.
    default: return 'error';
  }
}

/**
 * Une suppression n'arrive avec `old` complet que si la table est en
 * `REPLICA IDENTITY FULL` ; sinon Supabase ne fournit que la clé primaire.
 * On ne connaît donc pas toujours la version du mort — d'où
 * `Number.MAX_SAFE_INTEGER`, qui vaut « plus récent que tout ce que je
 * détiens ». Une resynchronisation le ressuscitera s'il existe encore, ce que
 * `VersionedStore.applySnapshot` sait faire.
 */
const deletedVersion = (old: Record<string, unknown> | null | undefined): number => {
  const version = Number(old?.version);
  return Number.isFinite(version) ? version : Number.MAX_SAFE_INTEGER;
};

export interface SupabaseSyncOptions {
  client: SupabaseClient;
  campaignId: string;
  /** Tables suivies, avec le dépôt versionné qui les reçoit. */
  tables: { name: string; store: VersionedStore<SyncRow> }[];
  /** Appelé après chaque changement appliqué, pour rafraîchir l'affichage. */
  onChanged?: (table: string) => void;
}

export function createSupabaseTransport(options: SupabaseSyncOptions): SyncTransport<SyncEvent> {
  const { client, campaignId, tables, onChanged } = options;

  return {
    open({ onEvent, onStatus }) {
      let channel: RealtimeChannel = client.channel(`jg:${campaignId}`);

      for (const { name } of tables) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: name, filter: `campaign_id=eq.${campaignId}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const old = payload.old as Record<string, unknown> | undefined;
              const id = old?.id ? String(old.id) : null;
              if (id) onEvent({ kind: 'delete', table: name, id, version: deletedVersion(old) });
              return;
            }
            const row = payload.new as SyncRow | undefined;
            if (row?.id) onEvent({ kind: 'upsert', table: name, row });
          },
        );
      }

      // Le rappel de statut : la ligne dont l'absence causait la panne.
      channel.subscribe((status) => onStatus(toChannelStatus(status)));

      return () => { void client.removeChannel(channel); };
    },

    async fetchSnapshot() {
      // Relecture complète, table par table. C'est ce qui rattrape tout ce
      // qui s'est passé pendant que le canal était mort — et pourquoi on ne
      // fait jamais confiance au seul flux incrémental.
      for (const { name, store } of tables) {
        const { data, error } = await client
          .from(name)
          .select('*')
          .eq('campaign_id', campaignId);
        if (error) throw new Error(`${name} : ${error.message}`);
        store.applySnapshot((data ?? []) as SyncRow[]);
        onChanged?.(name);
      }
    },
  };
}

/** Applique un événement au bon dépôt. Renvoie vrai si l'état a changé. */
export function applySyncEvent(
  event: SyncEvent,
  tables: { name: string; store: VersionedStore<SyncRow> }[],
): boolean {
  const target = tables.find((table) => table.name === event.table);
  if (!target) return false;
  const result = event.kind === 'upsert'
    ? target.store.applyUpsert(event.row)
    : target.store.applyDelete(event.id, event.version);
  return result.kind !== 'ignored';
}
