import { describe, expect, it, vi } from 'vitest';
import { SyncConnection, type ChannelStatus, type SyncEnvironment, type SyncTransport } from './connection';

/** Environnement simulé : horloge, minuteries et signaux de plateforme pilotés à la main. */
function makeEnvironment() {
  let clock = 0;
  let online = true;
  let visible = true;
  const listeners = new Set<() => void>();
  const timers = new Map<number, { fire: () => void; at: number }>();
  let nextHandle = 1;

  const environment: SyncEnvironment = {
    now: () => clock,
    setTimeout: (handler, delay) => {
      const handle = nextHandle++;
      timers.set(handle, { fire: handler, at: clock + delay });
      return handle;
    },
    clearTimeout: (handle) => { timers.delete(handle as number); },
    isOnline: () => online,
    isVisible: () => visible,
    onPlatformSignal: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  };

  return {
    environment,
    advance(ms: number) {
      clock += ms;
      for (const [handle, timer] of [...timers]) {
        if (timer.at <= clock) { timers.delete(handle); timer.fire(); }
      }
    },
    setOnline(value: boolean) { online = value; listeners.forEach((l) => l()); },
    setVisible(value: boolean) { visible = value; listeners.forEach((l) => l()); },
    get pendingTimers() { return timers.size; },
  };
}

function makeTransport() {
  const snapshots = vi.fn(async () => {});
  let handlers: { onEvent: (e: string) => void; onStatus: (s: ChannelStatus) => void } | null = null;
  const closes = vi.fn();
  let opens = 0;

  const transport: SyncTransport<string> = {
    open(h) { opens += 1; handlers = h; return closes; },
    fetchSnapshot: snapshots,
  };

  return {
    transport,
    snapshots,
    closes,
    get openCount() { return opens; },
    status(status: ChannelStatus) { handlers?.onStatus(status); },
    event(value: string) { handlers?.onEvent(value); },
  };
}

const setup = (overrides: Partial<Parameters<typeof SyncConnection<string>['prototype']['constructor']>[0]> = {}) => {
  const env = makeEnvironment();
  const tr = makeTransport();
  const events: string[] = [];
  const statuses: string[] = [];
  const connection = new SyncConnection<string>({
    transport: tr.transport,
    environment: env.environment,
    onEvent: (event) => events.push(event),
    onStatusChange: (status) => statuses.push(status),
    backoffMs: [100, 200],
    livenessTimeoutMs: 1_000,
    ...overrides,
  });
  return { env, tr, events, statuses, connection };
};

describe('cycle nominal', () => {
  it('ouvre le canal, resynchronise, puis se déclare à jour', async () => {
    const { tr, statuses, connection } = setup();
    connection.start();
    expect(connection.getStatus()).toBe('connecting');

    tr.status('subscribed');
    expect(connection.getStatus()).toBe('syncing');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    expect(tr.snapshots).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(['connecting', 'syncing', 'live']);
    expect(connection.isTrustworthy()).toBe(true);
  });

  it('une resynchronisation complète a lieu à CHAQUE ouverture de canal, jamais seulement à la première', async () => {
    const { tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    tr.status('error');
    tr.status('subscribed'); // ignoré : génération périmée après l'erreur
    expect(tr.snapshots).toHaveBeenCalledTimes(1);
  });
});

/**
 * Le scénario exact qui obligeait les joueurs à recharger l'app : le téléphone
 * met l'app en arrière-plan, l'OS coupe le websocket, le MJ lance un combat,
 * et au retour l'app affiche encore l'état d'avant.
 */
describe('retour au premier plan — la panne vécue avec table-connectee', () => {
  it('resynchronise au retour au premier plan, sans attendre le moindre événement', async () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));
    expect(tr.snapshots).toHaveBeenCalledTimes(1);

    env.setVisible(false);
    env.advance(200); // le MJ lance un combat pendant ce temps
    env.setVisible(true);

    await vi.waitFor(() => expect(tr.snapshots).toHaveBeenCalledTimes(2));
    expect(connection.getStatus()).toBe('live');
  });

  it('rouvre le canal si le silence a trop duré pendant l’arrière-plan', async () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));
    const avant = tr.openCount;

    env.setVisible(false);
    env.advance(5_000); // bien au-delà du délai de vie du canal
    env.setVisible(true);

    expect(tr.openCount).toBe(avant + 1); // canal réellement rouvert, pas juste relu
  });

  it('ne force rien tant que l’app est en arrière-plan', async () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    env.setVisible(false);
    env.advance(5_000);
    expect(tr.snapshots).toHaveBeenCalledTimes(1);
  });
});

describe('réseau', () => {
  it('passe hors ligne et se reconnecte au retour du réseau', async () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    env.setOnline(false);
    expect(connection.getStatus()).toBe('offline');
    expect(tr.closes).toHaveBeenCalled();

    env.setOnline(true);
    tr.status('subscribed');
    await vi.waitFor(() => expect(tr.snapshots).toHaveBeenCalledTimes(2));
  });

  it('ne tente pas d’ouvrir un canal quand le réseau est absent au démarrage', () => {
    const { env, tr, connection } = setup();
    env.setOnline(false);
    connection.start();
    expect(connection.getStatus()).toBe('offline');
    expect(tr.openCount).toBe(0);
  });
});

describe('canal en défaut', () => {
  it.each<ChannelStatus>(['error', 'timed-out', 'closed'])('reconnecte après « %s »', async (status) => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    tr.status(status);
    expect(connection.getStatus()).toBe('connecting');
    env.advance(100);
    expect(tr.openCount).toBe(2);
  });

  it('espace les tentatives successives', () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('error');
    env.advance(100);
    expect(tr.openCount).toBe(2);

    tr.status('error');
    env.advance(100); // pas encore : le deuxième délai est plus long
    expect(tr.openCount).toBe(2);
    env.advance(100);
    expect(tr.openCount).toBe(3);
  });

  it('une resynchronisation qui échoue déclenche une reconnexion, pas un état « à jour » mensonger', async () => {
    const env = makeEnvironment();
    const tr = makeTransport();
    tr.snapshots.mockRejectedValueOnce(new Error('réseau coupé'));
    const connection = new SyncConnection<string>({
      transport: tr.transport, environment: env.environment,
      onEvent: () => {}, backoffMs: [100], livenessTimeoutMs: 1_000,
    });
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('connecting'));
    expect(connection.isTrustworthy()).toBe(false);
  });
});

describe('canal mort silencieux', () => {
  it('rouvre de lui-même si plus rien n’arrive, sans attendre un signal de plateforme', async () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    env.advance(1_100);
    expect(tr.openCount).toBe(2);
  });
});

describe('événements', () => {
  it('transmet les événements reçus', async () => {
    const { tr, events, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));
    tr.event('combat-lance');
    expect(events).toEqual(['combat-lance']);
  });

  it('ignore les événements d’une connexion périmée', async () => {
    const { tr, events, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    const perime = tr;
    tr.status('error'); // la génération change
    perime.event('venu-du-passe');
    expect(events).toEqual([]);
  });
});

describe('arrêt', () => {
  it('ferme tout et ne planifie plus rien', async () => {
    const { env, tr, connection } = setup();
    connection.start();
    tr.status('subscribed');
    await vi.waitFor(() => expect(connection.getStatus()).toBe('live'));

    connection.stop();
    expect(connection.getStatus()).toBe('idle');
    expect(tr.closes).toHaveBeenCalled();
    expect(env.pendingTimers).toBe(0);

    env.setVisible(false);
    env.setVisible(true);
    expect(tr.snapshots).toHaveBeenCalledTimes(1);
  });
});
