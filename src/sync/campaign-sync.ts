import { SyncConnection, type SyncEnvironment, type SyncStatus } from './connection';
import { applySyncEvent, createSupabaseTransport, type SyncEvent, type SyncRow } from './supabase-transport';
import { VersionedStore } from './versioned-store';
import type { CharacterSheet } from '../model/character';
import type { EncounterState } from '../domain/encounter';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ce que la campagne expose aux écrans : un état complet, immuable, publié à
 * chaque changement.
 *
 * Volontairement une seule valeur, remplacée en bloc. Un écran qui s'abonne à
 * plusieurs morceaux séparés peut en afficher un à jour et l'autre périmé —
 * exactement le genre d'incohérence qu'on ne remarque qu'en partie, quand le
 * combat est lancé pour le MJ et pas encore pour la joueuse.
 */
export interface CampaignSnapshot {
  status: SyncStatus;
  sheets: StoredSheet[];
  /**
   * La rencontre à afficher. Quand plusieurs existent, c'est celle qui tourne ;
   * sinon la plus récente. `null` si la campagne n'en a aucune.
   */
  encounter: StoredEncounter | null;
  /** Journal public, écrit par le MJ. Visible de tous — la RLS s'en charge. */
  journalEntries: JournalEntry[];
  /**
   * Notes personnelles. La RLS ne renvoie jamais que les siennes : ce tableau
   * contient déjà exactement ce qu'un client a le droit de voir, jamais plus.
   */
  notes: Note[];
}

export interface StoredSheet {
  id: string;
  ownerId: string;
  version: number;
  data: CharacterSheet;
}

export interface StoredEncounter {
  id: string;
  version: number;
  state: EncounterState;
}

export interface JournalEntry {
  id: string;
  authorId: string;
  title: string | null;
  body: string;
  version: number;
  createdAt: string;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string | null;
  body: string;
  version: number;
  createdAt: string;
}

export const SHEETS_TABLE = 'jg_sheets';
export const ENCOUNTERS_TABLE = 'jg_encounters';
export const JOURNAL_TABLE = 'jg_journal_entries';
export const NOTES_TABLE = 'jg_notes';

/**
 * Choisit la rencontre courante. Une campagne accumule ses rencontres passées ;
 * l'écran n'en montre qu'une. Celle qui tourne prime toujours — si le MJ vient
 * de lancer un combat, c'est lui qu'on regarde, quelle que soit la date de
 * création des autres.
 */
export function currentEncounter(rows: StoredEncounter[]): StoredEncounter | null {
  if (rows.length === 0) return null;
  const running = rows.filter((row) => row.state.turnIndex >= 0);
  const pool = running.length > 0 ? running : rows;
  // À défaut de date, l'identifiant départage de façon stable : deux clients
  // doivent choisir la même, sinon ils n'affichent pas le même combat.
  return [...pool].sort((a, b) => (a.id < b.id ? 1 : -1))[0] ?? null;
}

const toSheet = (row: SyncRow): StoredSheet => ({
  id: row.id,
  ownerId: String(row.owner_id ?? ''),
  version: row.version,
  data: row.data as CharacterSheet,
});

const toEncounter = (row: SyncRow): StoredEncounter => ({
  id: row.id,
  version: row.version,
  state: row.state as EncounterState,
});

const toJournalEntry = (row: SyncRow): JournalEntry => ({
  id: row.id,
  authorId: String(row.author_id ?? ''),
  title: (row.title as string | null) ?? null,
  body: String(row.body ?? ''),
  version: row.version,
  createdAt: String(row.created_at ?? ''),
});

const toNote = (row: SyncRow): Note => ({
  id: row.id,
  ownerId: String(row.owner_id ?? ''),
  title: (row.title as string | null) ?? null,
  body: String(row.body ?? ''),
  version: row.version,
  createdAt: String(row.created_at ?? ''),
});

export interface CampaignSyncOptions {
  client: SupabaseClient;
  campaignId: string;
  environment: SyncEnvironment;
  onDiagnostic?: (message: string) => void;
}

/**
 * Assemble les pièces déjà testées séparément — dépôts versionnés, transport
 * Supabase, machine de reconnexion — et n'ajoute qu'une chose : la publication
 * d'un instantané cohérent.
 */
export class CampaignSync {
  private readonly sheets = new VersionedStore<SyncRow>();

  private readonly encounters = new VersionedStore<SyncRow>();

  private readonly journal = new VersionedStore<SyncRow>();

  private readonly notes = new VersionedStore<SyncRow>();

  private readonly listeners = new Set<() => void>();

  private readonly connection: SyncConnection<SyncEvent>;

  private snapshot: CampaignSnapshot = {
    status: 'idle', sheets: [], encounter: null, journalEntries: [], notes: [],
  };

  constructor(options: CampaignSyncOptions) {
    const tables = [
      { name: SHEETS_TABLE, store: this.sheets },
      { name: ENCOUNTERS_TABLE, store: this.encounters },
      { name: JOURNAL_TABLE, store: this.journal },
      { name: NOTES_TABLE, store: this.notes },
    ];

    const transport = createSupabaseTransport({
      client: options.client,
      campaignId: options.campaignId,
      tables,
      onChanged: () => this.publish(),
    });

    this.connection = new SyncConnection<SyncEvent>({
      transport,
      environment: options.environment,
      onDiagnostic: options.onDiagnostic,
      onEvent: (event) => { if (applySyncEvent(event, tables)) this.publish(); },
      // Le statut fait partie de l'instantané : un bandeau « hors ligne » ne
      // peut pas s'afficher si personne n'est prévenu de la bascule.
      onStatusChange: () => this.publish(),
    });
  }

  start(): void { this.connection.start(); }

  stop(): void { this.connection.stop(); }

  /** Force une relecture complète — le bouton « rafraîchir » du bandeau. */
  refresh(): void { this.connection.refresh(); }

  getSnapshot(): CampaignSnapshot { return this.snapshot; }

  /**
   * Injecte une ligne que la base vient de nous renvoyer après une écriture.
   *
   * Sans ça, l'auteur d'une modification attend son propre écho par le canal
   * temps réel pour la voir — un aller-retour serveur sur chaque bouton, ce
   * qui se sent au doigt. Ce n'est pas de l'optimisme : la ligne vient de la
   * base, version comprise, donc elle passe par le même contrôle d'ordre que
   * n'importe quel événement. Un écho plus ancien arrivé après sera ignoré.
   */
  ingest(table: string, row: SyncRow): void {
    const store = this.storeFor(table);
    if (!store) return;
    if (store.applyUpsert(row).kind !== 'ignored') this.publish();
  }

  /**
   * Même chose que `ingest`, côté suppression : l'auteur d'une suppression
   * n'attend pas non plus l'écho du canal pour voir sa note ou son entrée de
   * journal disparaître.
   */
  ingestDelete(table: string, id: string, version: number): void {
    const store = this.storeFor(table);
    if (!store) return;
    if (store.applyDelete(id, version).kind !== 'ignored') this.publish();
  }

  private storeFor(table: string): VersionedStore<SyncRow> | null {
    switch (table) {
      case SHEETS_TABLE: return this.sheets;
      case ENCOUNTERS_TABLE: return this.encounters;
      case JOURNAL_TABLE: return this.journal;
      case NOTES_TABLE: return this.notes;
      default: return null;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private publish(): void {
    const next: CampaignSnapshot = {
      status: this.connection.getStatus(),
      sheets: this.sheets.all().map(toSheet),
      encounter: currentEncounter(this.encounters.all().map(toEncounter)),
      journalEntries: this.journal.all().map(toJournalEntry),
      notes: this.notes.all().map(toNote),
    };
    // `useSyncExternalStore` compare par identité : republier un instantané
    // identique ferait re-rendre tous les écrans à chaque battement de canal.
    if (sameSnapshot(this.snapshot, next)) return;
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
}

/**
 * Deux instantanés sont équivalents si l'écran afficherait la même chose. On
 * compare les versions, pas les contenus : la base est seule à incrémenter la
 * version, donc versions égales veut dire contenus égaux, et la comparaison
 * reste bornée quelle que soit la taille des fiches.
 */
/** Deux listes versionnées sont équivalentes si chaque ligne y a la même version. */
function sameVersions(a: { id: string; version: number }[], b: { id: string; version: number }[]): boolean {
  if (a.length !== b.length) return false;
  const previous = new Map(a.map((row) => [row.id, row.version]));
  return b.every((row) => previous.get(row.id) === row.version);
}

function sameSnapshot(a: CampaignSnapshot, b: CampaignSnapshot): boolean {
  if (a.status !== b.status) return false;
  if (a.encounter?.id !== b.encounter?.id) return false;
  if (a.encounter?.version !== b.encounter?.version) return false;
  return sameVersions(a.sheets, b.sheets)
    && sameVersions(a.journalEntries, b.journalEntries)
    && sameVersions(a.notes, b.notes);
}
