import { SyncConnection, type SyncEnvironment, type SyncStatus } from './connection';
import type { CacheDeCampagne } from './cache-local';
import { applySyncEvent, createSupabaseTransport, type SyncEvent, type SyncRow } from './supabase-transport';
import { VersionedStore } from './versioned-store';
import type { CharacterSheet } from '../model/character';
import type { Combatant, EncounterState } from '../domain/encounter';
import { lireButin, type ButinPrepare } from '../domain/butin-prepare';
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
  /**
   * Vrai tant que rien n'est encore arrivé du réseau dans cette session : ce
   * qui est affiché vient du téléphone, tel qu'il l'a vu la dernière fois.
   * Bascule à faux à la première lecture réseau complète, et n'y revient
   * jamais — une coupure en cours de séance laisse des données fraîches,
   * qu'il n'y a aucune raison de désavouer.
   */
  depuisLeCache: boolean;
  /** Quand ce cache a été enregistré. `null` : rien de gardé sur ce téléphone. */
  dateDuCache: number | null;
  sheets: StoredSheet[];
  /**
   * La rencontre à afficher. Quand plusieurs existent, c'est celle qui tourne ;
   * sinon la plus récente. `null` si la campagne n'en a aucune.
   */
  encounter: StoredEncounter | null;
  /** Journal public, écrit par le MJ. Visible de tous — la RLS s'en charge. */
  journalEntries: JournalEntry[];
  /**
   * Notes personnelles. La RLS ne renvoie jamais que ce qu'on a le droit de
   * voir : les siennes pour un joueur, celles de toute la table pour le MJ
   * (qui garde un œil dessus, mais ne les écrit jamais).
   */
  notes: Note[];
  /**
   * Messages privés et secrets. Même remarque : ce tableau ne contient que ce
   * qu'on a le droit de lire — ce qu'on a écrit, ce qu'on a reçu, et tout
   * pour le MJ.
   */
  messages: Message[];
  /**
   * Rencontres préparées à l'avance — toujours vide côté joueur, la RLS ne
   * leur en renvoie aucune. Distinct de `encounter` : celles-ci n'ont ni
   * initiative ni tour, elles attendent d'être déclenchées.
   */
  encounterTemplates: StoredEncounterTemplate[];
  /**
   * Dons d'objets en transit — de mon sac vers celui d'un autre joueur, ou
   * l'inverse. Le destinataire les ajoute à sa fiche et efface la ligne dès
   * qu'il les voit ; ce tableau ne contient donc jamais que ce qui n'a pas
   * encore été récupéré.
   */
  itemTransfers: ItemTransfer[];
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

export interface StoredEncounterTemplate {
  id: string;
  version: number;
  name: string;
  /** Toujours côté créature : voir la migration 0007. */
  combatants: Combatant[];
  /**
   * Ce que la rencontre laisse derrière elle, préparé avec elle.
   * Toujours une forme lisible, jamais une absence — `lireButin` redresse
   * ce que la base rend (migration 0016).
   */
  butin: ButinPrepare;
}

export interface JournalEntry {
  id: string;
  authorId: string;
  title: string | null;
  /** Chapitre nommé à la main (« Valbrume »…) — `null` : registre général, pas orpheline. */
  chapter: string | null;
  body: string;
  version: number;
  createdAt: string;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string | null;
  chapter: string | null;
  body: string;
  version: number;
  createdAt: string;
}

/**
 * Un message privé, ou un secret confié par le MJ. Même forme pour les deux :
 * seul `kind` change qui a pu l'écrire et comment il s'affiche.
 */
export interface Message {
  id: string;
  authorId: string;
  recipientId: string;
  kind: 'message' | 'secret';
  body: string;
  version: number;
  createdAt: string;
}

/**
 * Un objet donné, en transit entre deux sacs — voir la migration
 * 0014_dons_objets.sql : ni l'un ni l'autre joueur ne peut écrire la fiche
 * de l'autre, cette ligne sert de relais entre les deux écritures.
 */
export interface ItemTransfer {
  id: string;
  senderId: string;
  recipientId: string;
  itemName: string;
  itemNote: string | null;
  itemCatalogId: string | null;
  qty: number;
  version: number;
  createdAt: string;
}

export const SHEETS_TABLE = 'jg_sheets';
export const ENCOUNTERS_TABLE = 'jg_encounters';
export const ENCOUNTER_TEMPLATES_TABLE = 'jg_encounter_templates';
export const JOURNAL_TABLE = 'jg_journal_entries';
export const NOTES_TABLE = 'jg_notes';
export const MESSAGES_TABLE = 'jg_messages';
export const ITEM_TRANSFERS_TABLE = 'jg_item_transfers';

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

const toEncounterTemplate = (row: SyncRow): StoredEncounterTemplate => ({
  id: row.id,
  version: row.version,
  name: String(row.name ?? ''),
  combatants: (row.combatants as Combatant[] | null) ?? [],
  butin: lireButin(row.butin),
});

const toJournalEntry = (row: SyncRow): JournalEntry => ({
  id: row.id,
  authorId: String(row.author_id ?? ''),
  title: (row.title as string | null) ?? null,
  chapter: (row.chapter as string | null) ?? null,
  body: String(row.body ?? ''),
  version: row.version,
  createdAt: String(row.created_at ?? ''),
});

const toNote = (row: SyncRow): Note => ({
  id: row.id,
  ownerId: String(row.owner_id ?? ''),
  title: (row.title as string | null) ?? null,
  chapter: (row.chapter as string | null) ?? null,
  body: String(row.body ?? ''),
  version: row.version,
  createdAt: String(row.created_at ?? ''),
});

const toMessage = (row: SyncRow): Message => ({
  id: row.id,
  authorId: String(row.author_id ?? ''),
  recipientId: String(row.recipient_id ?? ''),
  kind: row.kind === 'secret' ? 'secret' : 'message',
  body: String(row.body ?? ''),
  version: row.version,
  createdAt: String(row.created_at ?? ''),
});

const toItemTransfer = (row: SyncRow): ItemTransfer => ({
  id: row.id,
  senderId: String(row.sender_id ?? ''),
  recipientId: String(row.recipient_id ?? ''),
  itemName: String(row.item_name ?? ''),
  itemNote: (row.item_note as string | null) ?? null,
  itemCatalogId: (row.item_catalog_id as string | null) ?? null,
  qty: Number(row.qty ?? 1),
  version: row.version,
  createdAt: String(row.created_at ?? ''),
});

export interface CampaignSyncOptions {
  client: SupabaseClient;
  campaignId: string;
  environment: SyncEnvironment;
  onDiagnostic?: (message: string) => void;
  /**
   * Le dernier état connu, gardé sur le téléphone. Absent : on se comporte
   * comme avant, c'est-à-dire qu'il faut du réseau pour voir quoi que ce soit.
   */
  cache?: CacheDeCampagne;
}

/**
 * Écrire le cache à chaque changement coûterait une sérialisation complète de
 * la campagne à chaque point de vie retiré. Une fois par seconde suffit
 * largement : ce qu'on protège, c'est la perte du réseau, pas la dernière
 * demi-seconde de jeu — et la dernière écriture part de toute façon, le
 * minuteur en attente étant toujours relancé sur l'état le plus récent.
 */
export const DELAI_ECRITURE_CACHE_MS = 1000;

/**
 * Assemble les pièces déjà testées séparément — dépôts versionnés, transport
 * Supabase, machine de reconnexion — et n'ajoute qu'une chose : la publication
 * d'un instantané cohérent.
 */
export class CampaignSync {
  private readonly sheets = new VersionedStore<SyncRow>();

  private readonly encounters = new VersionedStore<SyncRow>();

  private readonly encounterTemplates = new VersionedStore<SyncRow>();

  private readonly journal = new VersionedStore<SyncRow>();

  private readonly notes = new VersionedStore<SyncRow>();

  private readonly messages = new VersionedStore<SyncRow>();

  private readonly itemTransfers = new VersionedStore<SyncRow>();

  private readonly listeners = new Set<() => void>();

  private readonly connection: SyncConnection<SyncEvent>;

  private snapshot: CampaignSnapshot = {
    status: 'idle', depuisLeCache: false, dateDuCache: null,
    sheets: [], encounter: null, journalEntries: [], notes: [], messages: [],
    encounterTemplates: [], itemTransfers: [],
  };

  private readonly cache: CacheDeCampagne | null;

  private readonly environment: SyncEnvironment;

  /** Tables suivies, gardées pour relire et réécrire le cache. */
  private readonly tables: { name: string; store: VersionedStore<SyncRow> }[];

  /** Faux tant qu'aucune lecture réseau complète n'a abouti dans cette session. */
  private depuisLeCache = false;

  private dateDuCache: number | null = null;

  private minuterieCache: unknown = null;

  constructor(options: CampaignSyncOptions) {
    this.cache = options.cache ?? null;
    this.environment = options.environment;

    const tables = [
      { name: SHEETS_TABLE, store: this.sheets },
      { name: ENCOUNTERS_TABLE, store: this.encounters },
      { name: ENCOUNTER_TEMPLATES_TABLE, store: this.encounterTemplates },
      { name: JOURNAL_TABLE, store: this.journal },
      { name: NOTES_TABLE, store: this.notes },
      { name: MESSAGES_TABLE, store: this.messages },
      { name: ITEM_TRANSFERS_TABLE, store: this.itemTransfers },
    ];
    this.tables = tables;

    const transport = createSupabaseTransport({
      client: options.client,
      campaignId: options.campaignId,
      tables,
      // `onChanged` n'est appelé QUE par la relecture complète (voir
      // `createSupabaseTransport`) : c'est donc le signal exact de « le réseau
      // a répondu », celui qui périme le cache affiché.
      onChanged: () => {
        this.depuisLeCache = false;
        this.publish();
      },
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

    this.hydraterDepuisLeCache();
  }

  /**
   * Remplit les dépôts avec ce que le téléphone a gardé, avant toute
   * connexion. Sans réseau, c'est ce qui s'affiche ; avec, ça ne dure que le
   * temps de la première lecture, qui écrase tout (`applySnapshot` fait
   * autorité) — et les versions portées par les lignes empêchent de toute
   * façon un cache périmé de reprendre le dessus.
   */
  private hydraterDepuisLeCache(): void {
    const garde = this.cache?.lire();
    if (!garde) return;
    let quelqueChose = false;
    for (const { name, store } of this.tables) {
      const lignes = garde.tables[name];
      if (!Array.isArray(lignes) || lignes.length === 0) continue;
      store.applySnapshot(lignes);
      quelqueChose = true;
    }
    if (!quelqueChose) return;
    this.depuisLeCache = true;
    this.dateDuCache = garde.enregistreLe;
    this.publish();
  }

  /**
   * Enregistre l'état courant sur le téléphone, au plus une fois par seconde.
   *
   * Jamais tant que le réseau n'a pas répondu : réécrire le cache à partir du
   * cache ne sert à rien, et le faire à partir de dépôts encore vides
   * effacerait un cache valable au premier battement.
   */
  private planifierEcritureCache(): void {
    if (!this.cache || this.depuisLeCache || this.minuterieCache !== null) return;
    this.minuterieCache = this.environment.setTimeout(() => {
      this.minuterieCache = null;
      const tables: Record<string, SyncRow[]> = {};
      for (const { name, store } of this.tables) tables[name] = store.all();
      this.cache?.ecrire(tables, this.environment.now());
    }, DELAI_ECRITURE_CACHE_MS);
  }

  start(): void { this.connection.start(); }

  stop(): void {
    this.connection.stop();
    if (this.minuterieCache !== null) {
      this.environment.clearTimeout(this.minuterieCache);
      this.minuterieCache = null;
    }
  }

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
      case ENCOUNTER_TEMPLATES_TABLE: return this.encounterTemplates;
      case JOURNAL_TABLE: return this.journal;
      case NOTES_TABLE: return this.notes;
      case MESSAGES_TABLE: return this.messages;
      case ITEM_TRANSFERS_TABLE: return this.itemTransfers;
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
      depuisLeCache: this.depuisLeCache,
      dateDuCache: this.dateDuCache,
      sheets: this.sheets.all().map(toSheet),
      encounter: currentEncounter(this.encounters.all().map(toEncounter)),
      journalEntries: this.journal.all().map(toJournalEntry),
      notes: this.notes.all().map(toNote),
      messages: this.messages.all().map(toMessage),
      encounterTemplates: this.encounterTemplates.all().map(toEncounterTemplate),
      itemTransfers: this.itemTransfers.all().map(toItemTransfer),
    };
    // `useSyncExternalStore` compare par identité : republier un instantané
    // identique ferait re-rendre tous les écrans à chaque battement de canal.
    if (sameSnapshot(this.snapshot, next)) return;
    this.snapshot = next;
    this.planifierEcritureCache();
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
  // Sans cette ligne, une campagne inchangée depuis la dernière séance
  // garderait son bandeau « hors ligne » après la reconnexion : les versions
  // seraient identiques, donc l'instantané jugé identique.
  if (a.depuisLeCache !== b.depuisLeCache) return false;
  if (a.encounter?.id !== b.encounter?.id) return false;
  if (a.encounter?.version !== b.encounter?.version) return false;
  return sameVersions(a.sheets, b.sheets)
    && sameVersions(a.journalEntries, b.journalEntries)
    && sameVersions(a.notes, b.notes)
    && sameVersions(a.messages, b.messages)
    && sameVersions(a.encounterTemplates, b.encounterTemplates)
    && sameVersions(a.itemTransfers, b.itemTransfers);
}
