/**
 * Dépôt d'enregistrements versionnés.
 *
 * Règle unique et non négociable : un événement incrémental n'est appliqué que
 * s'il est plus récent que ce qu'on détient déjà. C'est ce qui permet à une
 * resynchronisation complète et à un flux d'événements de cohabiter sans se
 * détruire mutuellement — le cas classique étant l'événement en vol qui arrive
 * après l'instantané qui le contenait déjà, et qui ferait régresser l'état.
 *
 * La table `characters` de Supabase porte déjà une colonne `version` : c'est
 * elle qui sert d'horloge, pas l'heure d'arrivée du message, qui ne veut rien
 * dire sur un réseau mobile.
 */

export interface VersionedRecord {
  id: string;
  version: number;
}

export type ChangeKind = 'inserted' | 'updated' | 'deleted' | 'ignored';

export interface ApplyResult<T> {
  kind: ChangeKind;
  record?: T;
  /** Raison du rejet, pour le journal de diagnostic. */
  reason?: 'version-obsolete' | 'inconnu-supprime';
}

export class VersionedStore<T extends VersionedRecord> {
  private records = new Map<string, T>();
  /** Versions des enregistrements supprimés, pour ne pas ressusciter un mort. */
  private tombstones = new Map<string, number>();

  get size(): number { return this.records.size; }

  get(id: string): T | undefined { return this.records.get(id); }

  all(): T[] { return [...this.records.values()]; }

  has(id: string): boolean { return this.records.has(id); }

  /**
   * Remplace tout l'état par un instantané complet. C'est la seule opération
   * qui fait autorité : après elle, ce que le dépôt contient est exactement ce
   * que le serveur contenait au moment de la lecture.
   *
   * Les pierres tombales sont purgées : si le serveur renvoie un
   * enregistrement, il existe, quoi qu'on ait cru avant.
   */
  applySnapshot(records: T[]): { added: T[]; updated: T[]; removed: string[] } {
    const next = new Map(records.map((record) => [record.id, record]));
    const added: T[] = [];
    const updated: T[] = [];
    const removed: string[] = [];

    for (const [id, record] of next) {
      const previous = this.records.get(id);
      if (!previous) added.push(record);
      else if (previous.version !== record.version) updated.push(record);
      this.tombstones.delete(id);
    }
    for (const id of this.records.keys()) {
      if (!next.has(id)) removed.push(id);
    }

    this.records = next;
    return { added, updated, removed };
  }

  /** Applique un enregistrement reçu par événement incrémental. */
  applyUpsert(record: T): ApplyResult<T> {
    const buried = this.tombstones.get(record.id);
    if (buried !== undefined && record.version <= buried) {
      return { kind: 'ignored', reason: 'version-obsolete' };
    }
    const previous = this.records.get(record.id);
    if (previous && record.version <= previous.version) {
      return { kind: 'ignored', reason: 'version-obsolete' };
    }
    this.tombstones.delete(record.id);
    this.records.set(record.id, record);
    return { kind: previous ? 'updated' : 'inserted', record };
  }

  /** Applique une suppression reçue par événement incrémental. */
  applyDelete(id: string, version: number): ApplyResult<T> {
    const previous = this.records.get(id);
    if (previous && version < previous.version) {
      return { kind: 'ignored', reason: 'version-obsolete' };
    }
    this.records.delete(id);
    this.tombstones.set(id, version);
    return previous ? { kind: 'deleted', record: previous } : { kind: 'ignored', reason: 'inconnu-supprime' };
  }

  clear(): void {
    this.records.clear();
    this.tombstones.clear();
  }
}
