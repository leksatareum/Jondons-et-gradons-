import { describe, expect, it } from 'vitest';
import { dateDuCacheLisible } from './SyncBanner';

/**
 * La date du cache, telle qu'on la lit d'un coup d'œil en pleine partie.
 * Les instants sont construits par composants pour rester justes quel que
 * soit le fuseau où tournent les tests.
 */
const instant = (an: number, mois: number, jour: number, h: number, m: number) =>
  new Date(an, mois - 1, jour, h, m).getTime();

describe('date du cache', () => {
  it('le même jour : l’heure seule suffit', () => {
    const lu = dateDuCacheLisible(instant(2026, 9, 2, 14, 5), instant(2026, 9, 2, 21, 40));
    expect(lu).toMatch(/^14[:h]05$/);
  });

  it('la veille : « hier » et l’heure', () => {
    const lu = dateDuCacheLisible(instant(2026, 9, 1, 21, 40), instant(2026, 9, 2, 9, 0));
    expect(lu).toMatch(/^hier 21[:h]40$/);
  });

  it('la veille compte en jours, pas en heures écoulées', () => {
    // Deux heures d'écart, mais bien deux jours différents : « hier » est ce
    // qu'on attend, pas l'heure nue qui laisserait croire à ce matin.
    const lu = dateDuCacheLisible(instant(2026, 9, 1, 23, 30), instant(2026, 9, 2, 1, 30));
    expect(lu).toMatch(/^hier /);
  });

  it('vingt-trois heures plus tôt le même jour reste une heure nue', () => {
    const lu = dateDuCacheLisible(instant(2026, 9, 2, 0, 30), instant(2026, 9, 2, 23, 30));
    expect(lu).toMatch(/^00[:h]30$/);
  });

  it('plus ancien : la date, sans l’heure qui ne dit plus rien', () => {
    expect(dateDuCacheLisible(instant(2026, 8, 28, 21, 40), instant(2026, 9, 2, 9, 0))).toBe('28/08');
  });

  it('un cache venu du futur (horloge du téléphone décalée) ne casse rien', () => {
    const lu = dateDuCacheLisible(instant(2026, 9, 3, 10, 0), instant(2026, 9, 2, 9, 0));
    expect(lu).toMatch(/^10[:h]00$/);
  });
});
