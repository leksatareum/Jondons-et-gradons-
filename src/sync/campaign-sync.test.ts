import { describe, expect, it, vi } from 'vitest';
import { CampaignSync, currentEncounter, type StoredEncounter } from './campaign-sync';
import type { SyncEnvironment } from './connection';
import type { SyncRow } from './supabase-transport';

/** Environnement piloté à la main : ni horloge réelle, ni navigateur. */
function makeEnvironment() {
  let clock = 0;
  const timers = new Map<number, { fire: () => void; at: number }>();
  let next = 1;
  const environment: SyncEnvironment = {
    now: () => clock,
    setTimeout: (handler, delay) => { const h = next++; timers.set(h, { fire: handler, at: clock + delay }); return h; },
    clearTimeout: (handle) => { timers.delete(handle as number); },
    isOnline: () => true,
    isVisible: () => true,
    onPlatformSignal: () => () => {},
  };
  return {
    environment,
    advance(ms: number) {
      clock += ms;
      for (const [h, timer] of [...timers]) if (timer.at <= clock) { timers.delete(h); timer.fire(); }
    },
  };
}

function fakeClient(rows: Record<string, SyncRow[]>) {
  const handlers: { table: string; callback: (payload: any) => void }[] = [];
  let statusCallback: ((status: string) => void) | null = null;
  const channel: any = {
    on(_e: string, filter: { table: string }, callback: (payload: any) => void) {
      handlers.push({ table: filter.table, callback });
      return channel;
    },
    subscribe(callback: (status: string) => void) { statusCallback = callback; return channel; },
  };
  const client: any = {
    channel: () => channel,
    removeChannel: () => {},
    from: (table: string) => ({ select: () => ({ eq: async () => ({ data: rows[table] ?? [], error: null }) }) }),
  };
  return {
    client,
    rows,
    emitStatus: (status: string) => statusCallback?.(status),
    emit: (table: string, payload: any) =>
      handlers.filter((h) => h.table === table).forEach((h) => h.callback(payload)),
  };
}

const sheetRow = (id: string, owner: string, name: string, version = 1): SyncRow =>
  ({ id, version, campaign_id: 'c1', owner_id: owner, data: { name } } as unknown as SyncRow);

const encounterRow = (id: string, turnIndex: number, version = 1): SyncRow =>
  ({ id, version, campaign_id: 'c1', state: { turnIndex, combatants: [] } } as unknown as SyncRow);

/** Monte une campagne branchée sur le client simulé, canal déjà ouvert et resynchronisé. */
async function connected(rows: Record<string, SyncRow[]> = {}) {
  const fake = fakeClient(rows);
  const env = makeEnvironment();
  const sync = new CampaignSync({ client: fake.client, campaignId: 'c1', environment: env.environment });
  const notified = vi.fn();
  sync.subscribe(notified);
  sync.start();
  fake.emitStatus('SUBSCRIBED');
  await vi.waitFor(() => expect(sync.getSnapshot().status).toBe('live'));
  return { fake, env, sync, notified };
}

describe('choix de la rencontre affichée', () => {
  const idle = (id: string): StoredEncounter => ({ id, version: 1, state: { turnIndex: -1, combatants: [] } as any });
  const running = (id: string): StoredEncounter => ({ id, version: 1, state: { turnIndex: 0, combatants: [] } as any });

  it('aucune rencontre : rien à afficher', () => {
    expect(currentEncounter([])).toBeNull();
  });

  it('celle qui tourne l’emporte, même si une autre est plus récente', () => {
    // `e9` trierait devant `e2` par identifiant ; c’est le combat lancé qui gagne.
    expect(currentEncounter([idle('e9'), running('e2')])?.id).toBe('e2');
  });

  it('sans combat lancé, la dernière créée', () => {
    expect(currentEncounter([idle('e1'), idle('e7'), idle('e3')])?.id).toBe('e7');
  });

  it('deux clients qui reçoivent les mêmes rencontres en désordre choisissent la même', () => {
    const a = currentEncounter([idle('e1'), idle('e2'), idle('e3')]);
    const b = currentEncounter([idle('e3'), idle('e1'), idle('e2')]);
    expect(a?.id).toBe(b?.id);
  });
});

describe('instantané publié aux écrans', () => {
  it('la resynchronisation initiale remplit les fiches et la rencontre', async () => {
    const { sync } = await connected({
      jg_sheets: [sheetRow('s1', 'u1', 'Brannoc'), sheetRow('s2', 'u2', 'Ylva')],
      jg_encounters: [encounterRow('e1', -1)],
    });
    const snapshot = sync.getSnapshot();
    expect(snapshot.sheets.map((s) => s.data.name)).toEqual(['Brannoc', 'Ylva']);
    expect(snapshot.sheets[0]?.ownerId).toBe('u1');
    expect(snapshot.encounter?.state.turnIndex).toBe(-1);
  });

  it('le MJ lance le combat : l’écran du joueur bascule sans rechargement', async () => {
    const { fake, sync, notified } = await connected({ jg_encounters: [encounterRow('e1', -1)] });
    expect(sync.getSnapshot().encounter?.state.turnIndex).toBe(-1);
    const avant = notified.mock.calls.length;

    fake.emit('jg_encounters', { eventType: 'UPDATE', new: encounterRow('e1', 0, 2) });

    expect(sync.getSnapshot().encounter?.state.turnIndex).toBe(0);
    expect(notified.mock.calls.length).toBeGreaterThan(avant);
  });

  it('un événement périmé ne fait pas reculer l’écran', async () => {
    const { fake, sync } = await connected({ jg_encounters: [encounterRow('e1', 3, 5)] });
    fake.emit('jg_encounters', { eventType: 'UPDATE', new: encounterRow('e1', 0, 2) });
    expect(sync.getSnapshot().encounter?.state.turnIndex).toBe(3);
  });

  it('l’instantané garde son identité quand rien ne change — sinon tout se redessine à chaque battement', async () => {
    const { fake, sync, notified } = await connected({ jg_sheets: [sheetRow('s1', 'u1', 'Brannoc')] });
    const avant = sync.getSnapshot();
    const appels = notified.mock.calls.length;

    // Même version : l’événement n’apporte rien.
    fake.emit('jg_sheets', { eventType: 'UPDATE', new: sheetRow('s1', 'u1', 'Brannoc', 1) });

    expect(sync.getSnapshot()).toBe(avant);
    expect(notified.mock.calls.length).toBe(appels);
  });

  it('la perte du canal est publiée : le bandeau « hors ligne » a besoin de le savoir', async () => {
    const { fake, sync } = await connected();
    expect(sync.getSnapshot().status).toBe('live');
    fake.emitStatus('CHANNEL_ERROR');
    expect(sync.getSnapshot().status).not.toBe('live');
  });

  it('une fiche supprimée disparaît de l’instantané', async () => {
    const { fake, sync } = await connected({ jg_sheets: [sheetRow('s1', 'u1', 'Brannoc')] });
    fake.emit('jg_sheets', { eventType: 'DELETE', old: { id: 's1', version: 2 } });
    expect(sync.getSnapshot().sheets).toEqual([]);
  });
});

describe('journal et notes dans l’instantané', () => {
  const journalRow = (id: string, author: string, body: string, version = 1): SyncRow =>
    ({ id, version, campaign_id: 'c1', author_id: author, title: null, body } as unknown as SyncRow);

  const noteRow = (id: string, owner: string, body: string, version = 1): SyncRow =>
    ({ id, version, campaign_id: 'c1', owner_id: owner, title: null, body } as unknown as SyncRow);

  it('la resynchronisation initiale remplit le journal et les notes — la RLS a déjà trié ce qui revient', async () => {
    const { sync } = await connected({
      jg_journal_entries: [journalRow('j1', 'mj1', 'Séance 1')],
      jg_notes: [noteRow('n1', 'u1', 'Se méfier du barman')],
    });
    const snapshot = sync.getSnapshot();
    expect(snapshot.journalEntries.map((e) => e.body)).toEqual(['Séance 1']);
    expect(snapshot.notes.map((n) => n.body)).toEqual(['Se méfier du barman']);
  });

  it('une nouvelle entrée de journal arrive par le canal sans rechargement', async () => {
    const { fake, sync } = await connected();
    fake.emit('jg_journal_entries', { eventType: 'INSERT', new: journalRow('j1', 'mj1', 'La table est arrivée') });
    expect(sync.getSnapshot().journalEntries).toHaveLength(1);
  });

  it('une note supprimée par son auteur disparaît de l’instantané', async () => {
    const { fake, sync } = await connected({ jg_notes: [noteRow('n1', 'u1', 'Secret')] });
    fake.emit('jg_notes', { eventType: 'DELETE', old: { id: 'n1', version: 1 } });
    expect(sync.getSnapshot().notes).toEqual([]);
  });

  it('ingestDelete retire une entrée sans attendre l’écho du canal', async () => {
    const { sync } = await connected({ jg_journal_entries: [journalRow('j1', 'mj1', 'Séance 1')] });
    sync.ingestDelete('jg_journal_entries', 'j1', 1);
    expect(sync.getSnapshot().journalEntries).toEqual([]);
  });
});
