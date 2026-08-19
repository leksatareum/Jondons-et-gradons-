import { describe, expect, it, vi } from 'vitest';
import { createBrowserEnvironment } from './browser-environment';

const fakeTarget = () => {
  const docListeners = new Map<string, Set<EventListener>>();
  const winListeners = new Map<string, Set<EventListener>>();
  const add = (map: Map<string, Set<EventListener>>) => (type: string, listener: EventListener) => {
    if (!map.has(type)) map.set(type, new Set());
    map.get(type)!.add(listener);
  };
  const remove = (map: Map<string, Set<EventListener>>) => (type: string, listener: EventListener) => {
    map.get(type)?.delete(listener);
  };
  const state = { visibilityState: 'visible' as DocumentVisibilityState, onLine: true };
  return {
    state, docListeners, winListeners,
    document: { addEventListener: add(docListeners), removeEventListener: remove(docListeners), get visibilityState() { return state.visibilityState; } } as unknown as Document,
    window: { addEventListener: add(winListeners), removeEventListener: remove(winListeners) } as unknown as Window & typeof globalThis,
    navigator: { get onLine() { return state.onLine; } } as unknown as Navigator,
    fire(map: Map<string, Set<EventListener>>, type: string) { map.get(type)?.forEach((l) => l(new Event(type))); },
  };
};

describe('branchement navigateur', () => {
  it('écoute les quatre signaux qui manquaient à l’ancienne app', () => {
    const target = fakeTarget();
    const environment = createBrowserEnvironment(target);
    environment.onPlatformSignal(() => {});
    expect([...target.docListeners.keys()]).toEqual(['visibilitychange']);
    expect([...target.winListeners.keys()].sort()).toEqual(['offline', 'online', 'pageshow']);
  });

  it('chaque signal réveille la synchronisation', () => {
    const target = fakeTarget();
    const listener = vi.fn();
    createBrowserEnvironment(target).onPlatformSignal(listener);

    target.fire(target.docListeners, 'visibilitychange');
    target.fire(target.winListeners, 'online');
    target.fire(target.winListeners, 'offline');
    target.fire(target.winListeners, 'pageshow');
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('se désabonne proprement', () => {
    const target = fakeTarget();
    const listener = vi.fn();
    const stop = createBrowserEnvironment(target).onPlatformSignal(listener);
    stop();
    target.fire(target.docListeners, 'visibilitychange');
    target.fire(target.winListeners, 'online');
    expect(listener).not.toHaveBeenCalled();
  });

  it('lit la visibilité et le réseau réels', () => {
    const target = fakeTarget();
    const environment = createBrowserEnvironment(target);
    expect(environment.isVisible()).toBe(true);
    expect(environment.isOnline()).toBe(true);

    target.state.visibilityState = 'hidden';
    target.state.onLine = false;
    expect(environment.isVisible()).toBe(false);
    expect(environment.isOnline()).toBe(false);
  });

  it('suppose le réseau présent quand l’information est absente', () => {
    const environment = createBrowserEnvironment({ navigator: {} as Navigator });
    expect(environment.isOnline()).toBe(true);
  });
});
