/**
 * Cycle de vie de la synchronisation temps réel.
 *
 * Conçu contre une panne précise et vécue : dans `table-connectee`, le canal
 * Supabase était ouvert par un `.subscribe()` sans callback de statut, sans
 * gestionnaire `visibilitychange` ni `online`, et sans relecture après coup.
 * Sur mobile, l'OS coupe le websocket dès que l'app passe en arrière-plan :
 * le canal mourait, personne ne le savait, et les événements de l'intervalle
 * étaient perdus définitivement. D'où l'obligation de recharger l'app quand le
 * MJ lançait un combat.
 *
 * Trois principes en réponse :
 *
 * 1. **Le statut du canal est observé**, pas supposé. Une erreur ou une
 *    expiration fait repasser en reconnexion, avec un délai croissant.
 * 2. **Toute (re)connexion déclenche une resynchronisation complète.** On ne
 *    fait jamais confiance au seul flux incrémental : il ne dit rien de ce qui
 *    s'est passé pendant qu'on n'écoutait pas.
 * 3. **Le retour au premier plan et le retour du réseau sont des signaux de
 *    reconnexion**, au même titre qu'une erreur de canal. C'est le cas normal
 *    sur téléphone, pas un cas limite.
 *
 * Tout est injecté (transport, horloge, minuteries, source des événements de
 * plateforme) pour que la logique soit testable sans réseau ni navigateur.
 */

export type SyncStatus =
  | 'idle' // pas encore démarré, ou arrêté
  | 'connecting' // canal en cours d'ouverture, ou reconnexion planifiée
  | 'syncing' // canal ouvert, resynchronisation complète en cours
  | 'live' // canal ouvert et état à jour
  | 'offline'; // réseau absent : inutile d'insister

export type ChannelStatus = 'subscribed' | 'error' | 'timed-out' | 'closed';

export interface SyncTransport<E> {
  /**
   * Ouvre le canal. `onStatus` doit être appelé à chaque changement d'état —
   * c'est précisément ce que l'ancienne app ne faisait pas.
   * Renvoie de quoi fermer le canal.
   */
  open(handlers: {
    onEvent: (event: E) => void;
    onStatus: (status: ChannelStatus) => void;
  }): () => void;

  /** Relit l'état complet depuis la source de vérité. */
  fetchSnapshot(): Promise<void>;
}

export interface SyncEnvironment {
  now(): number;
  setTimeout(handler: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
  /** `true` quand le réseau est réputé disponible. */
  isOnline(): boolean;
  /** `true` quand l'application est au premier plan. */
  isVisible(): boolean;
  /**
   * Abonne aux signaux de plateforme. Chaque appel du rappel signifie
   * « quelque chose a peut-être changé, revérifie » — retour au premier plan,
   * retour du réseau, perte du réseau.
   */
  onPlatformSignal(listener: () => void): () => void;
}

export interface SyncOptions<E> {
  transport: SyncTransport<E>;
  environment: SyncEnvironment;
  /** Appelé pour chaque événement reçu, uniquement quand l'état est fiable. */
  onEvent: (event: E) => void;
  onStatusChange?: (status: SyncStatus, previous: SyncStatus) => void;
  /** Journal de diagnostic — utile pour comprendre une coupure après coup. */
  onDiagnostic?: (message: string) => void;
  /** Délais de reconnexion, en millisecondes. Le dernier est répété. */
  backoffMs?: number[];
  /**
   * Au-delà de ce délai sans le moindre signe de vie du canal, on considère
   * la connexion morte même si personne ne nous a rien dit. C'est le filet
   * contre les websockets « à moitié ouverts », fréquents en mobilité.
   */
  livenessTimeoutMs?: number;
}

const DEFAULT_BACKOFF = [500, 1_000, 2_000, 5_000, 10_000, 30_000];
const DEFAULT_LIVENESS = 45_000;

export class SyncConnection<E> {
  private status: SyncStatus = 'idle';
  private closeChannel: (() => void) | null = null;
  private stopPlatformSignals: (() => void) | null = null;
  private retryHandle: unknown = null;
  private livenessHandle: unknown = null;
  private attempt = 0;
  /**
   * Incrémenté à chaque (re)connexion. Une resynchronisation lancée par une
   * génération périmée est ignorée à son retour : sans ça, un instantané lent
   * écraserait l'état d'une connexion plus récente.
   */
  private generation = 0;
  private lastActivityAt = 0;
  private started = false;

  constructor(private readonly options: SyncOptions<E>) {}

  getStatus(): SyncStatus { return this.status; }

  /** Vrai quand l'état affiché peut être considéré comme à jour. */
  isTrustworthy(): boolean { return this.status === 'live'; }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.stopPlatformSignals = this.options.environment.onPlatformSignal(() => this.handlePlatformSignal());
    this.connect();
  }

  stop(): void {
    this.started = false;
    this.teardownChannel();
    this.cancelRetry();
    this.cancelLiveness();
    this.stopPlatformSignals?.();
    this.stopPlatformSignals = null;
    this.setStatus('idle');
  }

  /** Force une resynchronisation immédiate, sans attendre un signal. */
  refresh(): void {
    if (!this.started) return;
    if (this.status === 'offline') { this.handlePlatformSignal(); return; }
    if (this.closeChannel) this.resync();
    else this.connect();
  }

  // ── Connexion ────────────────────────────────────────────────────────

  private connect(): void {
    if (!this.started) return;
    this.cancelRetry();

    if (!this.options.environment.isOnline()) {
      this.teardownChannel();
      this.setStatus('offline');
      this.diagnostic('réseau absent : connexion différée');
      return;
    }

    this.teardownChannel();
    this.generation += 1;
    this.setStatus('connecting');
    this.markActivity();

    const generation = this.generation;
    this.closeChannel = this.options.transport.open({
      onEvent: (event) => this.handleEvent(event, generation),
      onStatus: (status) => this.handleChannelStatus(status, generation),
    });
    this.armLiveness();
  }

  private handleChannelStatus(status: ChannelStatus, generation: number): void {
    if (!this.started || generation !== this.generation) return;
    this.markActivity();

    if (status === 'subscribed') {
      this.attempt = 0;
      this.diagnostic('canal ouvert : resynchronisation complète');
      // Le canal est ouvert, mais rien ne dit ce qu'on a manqué avant :
      // on relit tout avant de se déclarer à jour.
      this.resync();
      return;
    }
    this.diagnostic(`canal en défaut (${status}) : reconnexion`);
    this.scheduleReconnect();
  }

  private handleEvent(event: E, generation: number): void {
    if (!this.started || generation !== this.generation) return;
    this.markActivity();
    // Pendant une resynchronisation, l'événement est tout de même transmis :
    // le dépôt versionné tranche par numéro de version, pas par ordre
    // d'arrivée, donc un événement plus récent que l'instantané survit.
    this.options.onEvent(event);
  }

  private resync(): void {
    const generation = this.generation;
    this.setStatus('syncing');
    void this.options.transport.fetchSnapshot().then(
      () => {
        if (!this.started || generation !== this.generation) return;
        this.markActivity();
        this.setStatus('live');
      },
      (error: unknown) => {
        if (!this.started || generation !== this.generation) return;
        this.diagnostic(`resynchronisation échouée : ${String(error)}`);
        this.scheduleReconnect();
      },
    );
  }

  private scheduleReconnect(): void {
    if (!this.started) return;
    this.teardownChannel();
    this.cancelLiveness();

    if (!this.options.environment.isOnline()) {
      this.setStatus('offline');
      return;
    }

    const backoff = this.options.backoffMs ?? DEFAULT_BACKOFF;
    const delay = backoff[Math.min(this.attempt, backoff.length - 1)];
    this.attempt += 1;
    this.setStatus('connecting');
    this.cancelRetry();
    this.retryHandle = this.options.environment.setTimeout(() => {
      this.retryHandle = null;
      this.connect();
    }, delay);
  }

  // ── Signaux de plateforme ────────────────────────────────────────────

  /**
   * Retour au premier plan, retour ou perte du réseau. Sur téléphone, c'est
   * le chemin normal : l'app passe son temps en arrière-plan, et le canal n'y
   * survit pas.
   */
  private handlePlatformSignal(): void {
    if (!this.started) return;
    const { environment } = this.options;

    if (!environment.isOnline()) {
      this.teardownChannel();
      this.cancelRetry();
      this.cancelLiveness();
      this.setStatus('offline');
      this.diagnostic('réseau perdu');
      return;
    }

    if (!environment.isVisible()) return; // en arrière-plan : rien à forcer

    if (this.status === 'offline' || this.status === 'connecting') {
      this.attempt = 0;
      this.diagnostic('retour au premier plan ou du réseau : reconnexion immédiate');
      this.connect();
      return;
    }

    // Le canal se croit ouvert — mais après un passage en arrière-plan, c'est
    // exactement ce qu'un websocket mort prétend aussi. On revérifie.
    if (this.isStale()) {
      this.diagnostic('canal silencieux depuis trop longtemps : reconnexion');
      this.attempt = 0;
      this.connect();
      return;
    }
    if (this.status === 'live') {
      this.diagnostic('retour au premier plan : resynchronisation de contrôle');
      this.resync();
    }
  }

  // ── Détection de canal mort ──────────────────────────────────────────

  private isStale(): boolean {
    const limit = this.options.livenessTimeoutMs ?? DEFAULT_LIVENESS;
    return this.options.environment.now() - this.lastActivityAt > limit;
  }

  private markActivity(): void {
    this.lastActivityAt = this.options.environment.now();
    this.armLiveness();
  }

  private armLiveness(): void {
    if (!this.started) return;
    this.cancelLiveness();
    const limit = this.options.livenessTimeoutMs ?? DEFAULT_LIVENESS;
    this.livenessHandle = this.options.environment.setTimeout(() => {
      this.livenessHandle = null;
      if (!this.started) return;
      if (!this.options.environment.isVisible()) return; // inutile en arrière-plan
      this.diagnostic('aucun signe de vie du canal : reconnexion');
      this.attempt = 0;
      this.connect();
    }, limit);
  }

  private cancelLiveness(): void {
    if (this.livenessHandle !== null) {
      this.options.environment.clearTimeout(this.livenessHandle);
      this.livenessHandle = null;
    }
  }

  private cancelRetry(): void {
    if (this.retryHandle !== null) {
      this.options.environment.clearTimeout(this.retryHandle);
      this.retryHandle = null;
    }
  }

  /**
   * Ferme le canal ET invalide sa génération : un canal fermé peut encore
   * livrer un statut ou un événement en vol, et l'écouter reviendrait à agir
   * sur une connexion qui n'existe plus.
   *
   * L'invalidation se fait AVANT d'appeler le fermeur, pas après — c'est ce
   * qui a coûté une vraie panne en production. `supabase-js` déclenche, à
   * l'intérieur même de son `unsubscribe()`, un rappel de statut synchrone
   * (le canal se déclare « fermé » avant que l'appel ne rende la main). Ce
   * rappel revient ici dans `handleChannelStatus`, qui rappelle
   * `scheduleReconnect` → `teardownChannel` : si `this.closeChannel` n'a pas
   * encore été mis à `null` à ce moment-là (parce qu'on est encore dans son
   * tout premier appel, pas encore retourné), ce second passage referme LE
   * MÊME canal une seconde fois pendant que la première fermeture est encore
   * en cours — et ainsi de suite, `supabase-js` rentrant en boucle dans son
   * propre mécanisme de désabonnement jusqu'à épuiser la pile d'appels
   * (`RangeError: Maximum call stack size exceeded`). L'exception éclate en
   * plein milieu de `scheduleReconnect`, avant la ligne qui arme le minuteur
   * de reconnexion : la connexion reste plantée là, silencieusement, sans
   * plus jamais retenter — d'où le besoin de recharger l'app pour la faire
   * repartir.
   *
   * En couper court avant l'appel, le rappel réentrant voit une génération
   * déjà périmée (`generation !== this.generation`) et ressort aussitôt par
   * la garde de `handleChannelStatus`, exactement comme n'importe quel autre
   * événement tardif d'un canal qui n'existe déjà plus.
   */
  private teardownChannel(): void {
    const fermer = this.closeChannel;
    if (!fermer) return;
    this.closeChannel = null;
    this.generation += 1;
    fermer();
  }

  private setStatus(next: SyncStatus): void {
    if (next === this.status) return;
    const previous = this.status;
    this.status = next;
    this.options.onStatusChange?.(next, previous);
  }

  private diagnostic(message: string): void {
    this.options.onDiagnostic?.(message);
  }
}
