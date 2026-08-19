import { describe, expect, it } from 'vitest';
import {
  bindPactBlade, conjurePactTome, endPactBlade, forgoAttackForPactFamiliar,
  openPactTomeConjuration, pactBladeDamageType, pactTomeEligibleCantrips,
  pactTomeEligibleRituals, validatePactTomeSelection,
} from './warlock-pacts-core';

const warlock = (invocations: string | string[], extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  classSelections: { occultiste: { invocations } },
  cantrips: [],
  cantripSources: {},
  spells: [],
  turn: { action: false, bonus: false, reaction: false, attacksRemaining: 0 },
  companions: [],
  ...extra,
});

describe('Pactes fondamentaux de l’Occultiste PHB 2024', () => {
  it('Pacte de la Lame applique le type choisi uniquement à l’arme liée', () => {
    const bound = bindPactBlade(warlock('pact-blade'), 'epeelongue', 'Psychique');
    expect(pactBladeDamageType(bound, 'epeelongue', 'tranchants')).toBe('Psychique');
    expect(pactBladeDamageType(bound, 'dague', 'perforants')).toBe('perforants');
  });

  it('mettre fin au Pacte de la Lame retire aussi l’attaque d’une arme conjurée', () => {
    const ended = endPactBlade(warlock('pact-blade', {
      pactBladeWeaponId: 'epeelongue',
      pactBladeDamageType: 'Radiant',
      pactBladeConjuredAttackId: 'pact-conjured-epeelongue',
      attacks: [
        { id: 'pact-conjured-epeelongue', weaponId: 'epeelongue' },
        { id: 'w1', weaponId: 'dague' },
      ],
    }));
    expect(ended.pactBladeWeaponId).toBeNull();
    expect(ended.pactBladeDamageType).toBeNull();
    expect(ended.attacks).toEqual([{ id: 'w1', weaponId: 'dague' }]);
  });

  it('Pacte du Grimoire filtre trois cantrips et deux rituels de niveau 1 non déjà préparés', () => {
    const spells = [
      { id: 'a', lv: 0 }, { id: 'b', lv: 0 }, { id: 'c', lv: 0 }, { id: 'd', lv: 0 },
      { id: 'rituel-1', lv: 1, ri: true }, { id: 'rituel-2', lv: 1, ri: true },
      { id: 'rituel-bloque', lv: 1, ri: true }, { id: 'sort-normal', lv: 1, ri: false },
    ];
    expect(pactTomeEligibleCantrips(spells, ['d']).map((spell) => spell.id)).toEqual(['a', 'b', 'c']);
    expect(pactTomeEligibleRituals(spells, ['rituel-bloque']).map((spell) => spell.id)).toEqual(['rituel-1', 'rituel-2']);
    expect(validatePactTomeSelection(['a', 'b', 'c'], ['rituel-1', 'rituel-2'], ['a', 'b', 'c'], ['rituel-1', 'rituel-2'])).toBe(true);
    expect(validatePactTomeSelection(['a', 'b'], ['rituel-1', 'rituel-2'], ['a', 'b', 'c'], ['rituel-1', 'rituel-2'])).toBe(false);
  });

  it('le Livre des Ombres apparaît après un repos et remplace proprement ses anciens sorts', () => {
    const initial = warlock('pact-tome', {
      cantrips: ['ancien', 'racial'],
      cantripSources: { ancien: ['pact-tome'], racial: ['species'] },
      spells: [
        { id: 'ancien-rituel', sourceClass: 'pact-tome', prepared: true },
        { id: 'hex', sourceClass: 'occultiste', prepared: true },
      ],
      pactTomeBook: { cantrips: ['ancien'], rituals: ['ancien-rituel'] },
    });
    const opened = openPactTomeConjuration(initial);
    expect(opened.pactTomeConjureAvailable).toBe(true);
    const next = conjurePactTome(opened, ['a', 'b', 'c'], ['rituel-1', 'rituel-2']);
    expect(next.pactTomeConjureAvailable).toBe(false);
    expect(next.cantrips).toEqual(expect.arrayContaining(['racial', 'a', 'b', 'c']));
    expect(next.cantrips).not.toContain('ancien');
    expect(next.cantripSources?.racial).toEqual(['species']);
    expect(next.cantripSources?.a).toEqual(['pact-tome']);
    expect(next.spells?.find((spell) => spell.id === 'ancien-rituel')).toBeUndefined();
    expect(next.spells?.filter((spell) => spell.sourceClass === 'pact-tome').map((spell) => spell.id)).toEqual(['rituel-1', 'rituel-2']);
    expect(next.spells?.find((spell) => spell.id === 'hex')).toBeTruthy();
  });

  it('Pacte de la Chaîne peut démarrer l’action Attaquer en sacrifiant une attaque au familier', () => {
    const ch = warlock('pact-chain', {
      companions: [{ id: 'fam', source: 'pact-chain', family: 'familiar', turn: { reaction: false } }],
    });
    const result = forgoAttackForPactFamiliar(ch, 'fam', 2);
    expect(result).not.toBeNull();
    expect(result?.startedAttackAction).toBe(true);
    expect(result?.attacksRemaining).toBe(1);
    expect(result?.character.turn?.action).toBe(true);
    expect(result?.character.companions?.[0].turn?.reaction).toBe(true);
  });

  it('Pacte de la Chaîne consomme une attaque restante sans redépenser l’action', () => {
    const ch = warlock('pact-chain', {
      turn: { action: true, bonus: false, reaction: false, attacksRemaining: 2 },
      companions: [{ id: 'fam', source: 'pact-chain', family: 'familiar', turn: { reaction: false } }],
    });
    const result = forgoAttackForPactFamiliar(ch, 'fam', 1);
    expect(result?.startedAttackAction).toBe(false);
    expect(result?.attacksRemaining).toBe(1);
  });

  it('Pacte de la Chaîne refuse une seconde attaque du familier si sa Réaction est déjà dépensée', () => {
    const ch = warlock('pact-chain', {
      companions: [{ id: 'fam', source: 'pact-chain', family: 'familiar', turn: { reaction: true } }],
    });
    expect(forgoAttackForPactFamiliar(ch, 'fam', 2)).toBeNull();
  });
});
