import { describe, expect, it } from 'vitest';
import { isPlayableNow, layoutCombatCards, type PlayableCard } from './combat-layout';

const carte = (id: string, economy: PlayableCard['economy'], extra: Partial<PlayableCard> = {}): PlayableCard =>
  ({ id, name: id, economy, ...extra });

const combat = (isYourTurn: boolean) => ({ mode: 'combat' as const, isYourTurn });
const libre = { mode: 'libre' as const };

const jeu = [
  carte('explosion', 'action'),
  carte('agathys', 'action'),
  carte('pas-des-fees', 'bonus'),
  carte('reprimande', 'reaction'),
];

describe('à ton tour', () => {
  it('les actions passent devant, la réaction est reléguée', () => {
    const { featured, muted } = layoutCombatCards(jeu, { turn: combat(true) });
    expect(featured.map((c) => c.id)).toEqual(['explosion', 'agathys', 'pas-des-fees']);
    expect(muted.map((c) => c.id)).toEqual(['reprimande']);
  });

  it('une économie dépensée retire ses cartes du jouable, sans les masquer', () => {
    const { featured, muted } = layoutCombatCards(jeu, { turn: combat(true), spent: { action: true } });
    expect(featured.map((c) => c.id)).toEqual(['pas-des-fees']);
    expect(muted.map((c) => c.id)).toEqual(['explosion', 'agathys', 'reprimande']);
  });
});

describe('quand ce n’est pas ton tour — l’ordre s’inverse', () => {
  it('la réaction passe en tête et le reste est relégué', () => {
    const { featured, muted } = layoutCombatCards(jeu, { turn: combat(false) });
    expect(featured.map((c) => c.id)).toEqual(['reprimande']);
    expect(muted.map((c) => c.id)).toEqual(['explosion', 'agathys', 'pas-des-fees']);
  });

  it('la réaction reste disponible hors de ton tour, l’action non', () => {
    const { available } = layoutCombatCards(jeu, { turn: combat(false) });
    expect(available.reaction).toBe(true);
    expect(available.action).toBe(false);
    expect(available.bonus).toBe(false);
  });

  it('une réaction déjà dépensée n’est plus jouable', () => {
    expect(layoutCombatCards(jeu, { turn: combat(false), spent: { reaction: true } }).featured).toEqual([]);
  });
});

describe('ressources épuisées', () => {
  const sansForme = carte('forme-sauvage', 'bonus', {
    resource: { key: 'druide:forme-sauvage', remaining: 0, max: 2, label: 'Forme sauvage' },
  });

  it('une carte sans ressource restante est reléguée, jamais retirée', () => {
    const { featured, muted } = layoutCombatCards([sansForme], { turn: combat(true) });
    expect(featured).toEqual([]);
    expect(muted.map((c) => c.id)).toEqual(['forme-sauvage']);
  });

  it('elle redevient jouable dès qu’il reste une utilisation', () => {
    expect(isPlayableNow({ ...sansForme, resource: { ...sansForme.resource!, remaining: 1 } }, { turn: combat(true) })).toBe(true);
  });
});

describe('rien ne disparaît jamais', () => {
  it.each([true, false])('toutes les cartes sont rendues (ton tour : %s)', (isYourTurn) => {
    const { featured, muted } = layoutCombatCards(jeu, { turn: combat(isYourTurn) });
    expect([...featured, ...muted].map((c) => c.id).sort()).toEqual(jeu.map((c) => c.id).sort());
  });
});

/**
 * Le tour par tour n'existe que lorsque le MJ l'a lancé. Hors combat, ces
 * notions n'ont aucun sens : la première version de l'écran affichait quand
 * même une économie d'action en exploration, inventant une contrainte que le
 * jeu ne pose pas.
 */
describe('hors combat — le MJ n’a pas lancé le tour par tour', () => {
  it('aucune économie d’action n’est affichée', () => {
    expect(layoutCombatCards(jeu, { turn: libre }).showEconomy).toBe(false);
  });

  it('tout est jouable, réaction comprise, sans réordonnancement', () => {
    const { featured, muted } = layoutCombatCards(jeu, { turn: libre });
    expect(featured.map((c) => c.id)).toEqual(['explosion', 'agathys', 'pas-des-fees', 'reprimande']);
    expect(muted).toEqual([]);
  });

  it('une économie « dépensée » ne bloque rien hors combat', () => {
    const { featured } = layoutCombatCards(jeu, { turn: libre, spent: { action: true, bonus: true, reaction: true } });
    expect(featured).toHaveLength(4);
  });

  it('une ressource épuisée reste la seule vraie contrainte', () => {
    const epuise = carte('forme-sauvage', 'bonus', {
      resource: { key: 'druide:forme-sauvage', remaining: 0, max: 2, label: 'Forme sauvage' },
    });
    const { featured, muted } = layoutCombatCards([...jeu, epuise], { turn: libre });
    expect(muted.map((c) => c.id)).toEqual(['forme-sauvage']);
    expect(featured).toHaveLength(4);
  });

  it('en combat, l’économie redevient visible', () => {
    expect(layoutCombatCards(jeu, { turn: combat(true) }).showEconomy).toBe(true);
    expect(layoutCombatCards(jeu, { turn: combat(false) }).showEconomy).toBe(true);
  });
});
