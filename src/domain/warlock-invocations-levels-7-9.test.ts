import { describe, expect, it } from 'vitest';
import {
  addGiftProtectorName,
  giftProtectorsCanSave,
  giftProtectorsCapacity,
  lifedrinkerEligible,
  lifedrinkerHitDice,
  removeGiftProtectorName,
  resetGiftProtectors,
  resolveLifedrinker,
  triggerGiftProtectors,
} from './warlock-invocations-levels-7-9';

const warlock = (invocations: string | string[], extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  level: 9,
  classLevels: [{ classId: 'occultiste', level: 9 }],
  abilities: { cha: 18, con: 14 },
  classSelections: { occultiste: { invocations } },
  pactBladeWeaponId: 'epeelongue',
  pactTomeBook: { cantrips: ['a', 'b', 'c'], rituals: ['r1', 'r2'] },
  hp: 20,
  hpMax: 40,
  hitDicePools: [{ die: 8, current: 3, max: 9 }],
  hitDiceLeft: 3,
  turn: { action: false, bonus: false, reaction: false },
  ...extra,
});

describe('Invocations Occultiste PHB 2024 niveaux 7 à 9', () => {
  it('Buveuse de vie ne s’active qu’au niveau 9 sur l’arme de pacte et une seule fois par tour', () => {
    const ch = warlock(['pact-blade', 'lifedrinker']);
    expect(lifedrinkerEligible(ch, 'epeelongue')).toBe(true);
    expect(lifedrinkerEligible(ch, 'dague')).toBe(false);
    expect(lifedrinkerEligible({ ...ch, turn: { lifedrinkerUsed: true } }, 'epeelongue')).toBe(false);
    expect(lifedrinkerEligible({ ...ch, level: 8, classLevels: [{ classId: 'occultiste', level: 8 }] }, 'epeelongue')).toBe(false);
  });

  it('Buveuse de vie ajoute 1d6 du type choisi et peut réellement dépenser un dé de vie pour soigner jet + CON', () => {
    const ch = warlock(['pact-blade', 'lifedrinker']);
    const result = resolveLifedrinker(ch, 'epeelongue', 'Psychique', 8, 5);
    expect(result).not.toBeNull();
    expect(result?.extraDamage).toBe('1d6');
    expect(result?.damageType).toBe('Psychique');
    expect(result?.healed).toBe(7);
    expect(result?.spentHitDie).toBe(8);
    expect(result?.character.hp).toBe(27);
    expect(result?.character.hitDicePools?.[0].current).toBe(2);
    expect(result?.character.hitDiceLeft).toBe(2);
    expect(result?.character.turn?.lifedrinkerUsed).toBe(true);
  });

  it('Buveuse de vie peut infliger ses dégâts sans dépenser de dé de vie', () => {
    const ch = warlock(['pact-blade', 'lifedrinker']);
    const result = resolveLifedrinker(ch, 'epeelongue', 'Radiant');
    expect(result?.healed).toBe(0);
    expect(result?.spentHitDie).toBeNull();
    expect(result?.character.hitDicePools?.[0].current).toBe(3);
    expect(lifedrinkerHitDice(result!.character)).toHaveLength(1);
  });

  it('Don des protecteurs limite la page au modificateur de Charisme avec un minimum de 1', () => {
    const ch = warlock(['pact-tome', 'gift-of-the-protectors']);
    expect(giftProtectorsCapacity(ch)).toBe(4);
    const weak = warlock(['pact-tome', 'gift-of-the-protectors'], { abilities: { cha: 8, con: 14 } });
    expect(giftProtectorsCapacity(weak)).toBe(1);
  });

  it('ajoute et efface les noms de la page sans doublon et sans dépasser la capacité', () => {
    let ch = warlock(['pact-tome', 'gift-of-the-protectors']);
    ch = addGiftProtectorName(ch, 'Aldric');
    ch = addGiftProtectorName(ch, 'Corvin');
    ch = addGiftProtectorName(ch, 'aldric');
    ch = addGiftProtectorName(ch, 'Yseline');
    ch = addGiftProtectorName(ch, 'Blanc');
    ch = addGiftProtectorName(ch, 'Lent');
    expect(ch.giftProtectorsNames).toEqual(['Aldric', 'Corvin', 'Yseline', 'Blanc']);
    ch = removeGiftProtectorName(ch, 'corvin');
    expect(ch.giftProtectorsNames).toEqual(['Aldric', 'Yseline', 'Blanc']);
  });

  it('Don des protecteurs partage un seul déclenchement par repos long pour toute la page', () => {
    let ch = warlock(['pact-tome', 'gift-of-the-protectors'], { giftProtectorsNames: ['Aldric', 'Corvin'] });
    expect(giftProtectorsCanSave(ch, 'Aldric')).toBe(true);
    expect(giftProtectorsCanSave(ch, 'Corvin')).toBe(true);
    ch = triggerGiftProtectors(ch);
    expect(giftProtectorsCanSave(ch, 'Aldric')).toBe(false);
    expect(giftProtectorsCanSave(ch, 'Corvin')).toBe(false);
    ch = resetGiftProtectors(ch);
    expect(giftProtectorsCanSave(ch, 'Aldric')).toBe(true);
  });

  it('Don des protecteurs exige le Pacte du Grimoire, son Invocation et un Livre actif', () => {
    expect(giftProtectorsCanSave(warlock(['gift-of-the-protectors'], { giftProtectorsNames: ['Aldric'] }), 'Aldric')).toBe(false);
    expect(giftProtectorsCanSave(warlock(['pact-tome', 'gift-of-the-protectors'], { pactTomeBook: null, giftProtectorsNames: ['Aldric'] }), 'Aldric')).toBe(false);
  });
});
