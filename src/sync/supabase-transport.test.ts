import { describe, expect, it, vi } from 'vitest';
import { applySyncEvent, createSupabaseTransport, toChannelStatus, type SyncRow } from './supabase-transport';
import { VersionedStore } from './versioned-store';

/** Doublure minimale du client Supabase : on vérifie le CONTRAT, pas le réseau. */
function fakeClient(rows: Record<string, SyncRow[]> = {}) {
  const handlers: { table: string; callback: (payload: any) => void }[] = [];
  let statusCallback: ((status: string) => void) | null = null;
  const removed: unknown[] = [];

  const channel: any = {
    on(_event: string, filter: { table: string }, callback: (payload: any) => void) {
      handlers.push({ table: filter.table, callback });
      return channel;
    },
    subscribe(callback: (status: string) => void) { statusCallback = callback; return channel; },
  };

  const client: any = {
    channel: () => channel,
    removeChannel: (c: unknown) => { removed.push(c); },
    from: (table: string) => ({
      select: () => ({ eq: async () => ({ data: rows[table] ?? [], error: null }) }),
    }),
  };

  return {
    client,
    removed,
    emitStatus: (status: string) => statusCallback?.(status),
    emit: (table: string, payload: any) =>
      handlers.filter((h) => h.table === table).forEach((h) => h.callback(payload)),
  };
}

const setup = (rows?: Record<string, SyncRow[]>) => {
  const fake = fakeClient(rows);
  const store = new VersionedStore<SyncRow>();
  const tables = [{ name: 'jg_sheets', store }];
  const transport = createSupabaseTransport({ client: fake.client, campaignId: 'c1', tables });
  return { fake, store, tables, transport };
};

describe('traduction des statuts de canal', () => {
  it.each([
    ['SUBSCRIBED', 'subscribed'],
    ['CHANNEL_ERROR', 'error'],
    ['TIMED_OUT', 'timed-out'],
    ['CLOSED', 'closed'],
  ])('%s → %s', (supabase, attendu) => {
    expect(toChannelStatus(supabase)).toBe(attendu);
  });

  it('un statut inconnu compte comme une erreur — mieux vaut reconnecter pour rien qu’ignorer un canal mort', () => {
    expect(toChannelStatus('QUELQUE_CHOSE_DE_NOUVEAU')).toBe('error');
  });
});

describe('le rappel de statut, dont l’absence causait la panne', () => {
  it('est bien transmis à subscribe() et remonte à la machine', () => {
    const { fake, transport } = setup();
    const onStatus = vi.fn();
    transport.open({ onEvent: vi.fn(), onStatus });

    fake.emitStatus('SUBSCRIBED');
    fake.emitStatus('CHANNEL_ERROR');
    expect(onStatus).toHaveBeenNthCalledWith(1, 'subscribed');
    expect(onStatus).toHaveBeenNthCalledWith(2, 'error');
  });

  it('fermer le canal le retire réellement du client', () => {
    const { fake, transport } = setup();
    const close = transport.open({ onEvent: vi.fn(), onStatus: vi.fn() });
    close();
    expect(fake.removed).toHaveLength(1);
  });
});

describe('traduction des changements', () => {
  it('une insertion et une mise à jour deviennent un upsert', () => {
    const { fake, transport } = setup();
    const onEvent = vi.fn();
    transport.open({ onEvent, onStatus: vi.fn() });

    fake.emit('jg_sheets', { eventType: 'INSERT', new: { id: 's1', version: 1 } });
    fake.emit('jg_sheets', { eventType: 'UPDATE', new: { id: 's1', version: 2 } });
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[1][0]).toEqual({ kind: 'upsert', table: 'jg_sheets', row: { id: 's1', version: 2 } });
  });

  it('une suppression sans version connue est traitée comme la plus récente', () => {
    const { fake, transport } = setup();
    const onEvent = vi.fn();
    transport.open({ onEvent, onStatus: vi.fn() });

    fake.emit('jg_sheets', { eventType: 'DELETE', old: { id: 's1' } });
    expect(onEvent.mock.calls[0][0]).toMatchObject({ kind: 'delete', id: 's1', version: Number.MAX_SAFE_INTEGER });
  });

  it('une ligne sans identifiant est ignorée plutôt que de faire planter le canal', () => {
    const { fake, transport } = setup();
    const onEvent = vi.fn();
    transport.open({ onEvent, onStatus: vi.fn() });

    fake.emit('jg_sheets', { eventType: 'INSERT', new: {} });
    fake.emit('jg_sheets', { eventType: 'DELETE', old: undefined });
    expect(onEvent).not.toHaveBeenCalled();
  });
});

describe('resynchronisation complète', () => {
  it('remplace l’état du dépôt par ce que la base contient', async () => {
    const { store, transport } = setup({ jg_sheets: [{ id: 's1', version: 3 }, { id: 's2', version: 1 }] });
    store.applyUpsert({ id: 'disparu', version: 1 });

    await transport.fetchSnapshot();
    expect(store.all().map((r) => r.id).sort()).toEqual(['s1', 's2']);
  });

  it('une erreur de lecture remonte, pour que la machine reconnecte au lieu de se croire à jour', async () => {
    const fake = fakeClient();
    fake.client.from = () => ({ select: () => ({ eq: async () => ({ data: null, error: { message: 'jeton expiré' } }) }) });
    const transport = createSupabaseTransport({
      client: fake.client, campaignId: 'c1',
      tables: [{ name: 'jg_sheets', store: new VersionedStore<SyncRow>() }],
    });
    await expect(transport.fetchSnapshot()).rejects.toThrow(/jeton expiré/);
  });
});

describe('application des événements', () => {
  const tables = () => [{ name: 'jg_sheets', store: new VersionedStore<SyncRow>() }];

  it('un événement plus ancien que l’état détenu ne change rien', () => {
    const t = tables();
    t[0].store.applySnapshot([{ id: 's1', version: 5 }]);
    expect(applySyncEvent({ kind: 'upsert', table: 'jg_sheets', row: { id: 's1', version: 3 } }, t)).toBe(false);
    expect(t[0].store.get('s1')?.version).toBe(5);
  });

  it('un événement plus récent est appliqué', () => {
    const t = tables();
    t[0].store.applySnapshot([{ id: 's1', version: 5 }]);
    expect(applySyncEvent({ kind: 'upsert', table: 'jg_sheets', row: { id: 's1', version: 6 } }, t)).toBe(true);
  });

  it('un événement d’une table non suivie est ignoré sans erreur', () => {
    expect(applySyncEvent({ kind: 'upsert', table: 'autre', row: { id: 'x', version: 1 } }, tables())).toBe(false);
  });
});
