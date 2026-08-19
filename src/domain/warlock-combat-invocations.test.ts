import { describe, expect, it } from 'vitest';
import {
  agonizingCantripDamageDisplay,
  attackRollCountForCantrip,
  effectiveEldritchSpearRangeMeters,
  eldritchBlastBeamCount,
  eldritchSmiteDice,
  eldritchSmiteOffer,
  repellingBlastResolution,
} from './warlock-combat-invocations';

const warlock = (invocations: string | string[], extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  level: 5,
  abilities: { cha: 18 },
  classSelections: { occultiste: { invocations } },
  ...extra,
});

describe('Invocations de combat Occultiste PHB 2024 niveaux 1 à 5', () => {
  it('Châtiment occulte consomme un emplacement de pacte et inflige 1d8 + 1d8 par niveau de slot', () => {
    expect(eldritchSmiteDice(3)).toBe(4);
    const offer = eldritchSmiteOffer(warlock(['pact-blade', 'eldritch-smite'], {
      pactBladeWeaponId: 'epeelongue',
      pactSlots: [{ level: 3, current: 1, max: 2 }],
      turn: {},
    }), 'epeelongue');
    expect(offer).toEqual({ slotLevel: 3, dice: 4, damageFormula: '4d8 Force', mayProneHugeOrSmaller: true });
  });

  it('Châtiment occulte est refusé hors arme de pacte, sans slot ou après son usage du tour', () => {
    const base = { pactBladeWeaponId: 'epeelongue', pactSlots: [{ level: 3, current: 1, max: 2 }] };
    expect(eldritchSmiteOffer(warlock(['pact-blade', 'eldritch-smite'], base), 'dague')).toBeNull();
    expect(eldritchSmiteOffer(warlock(['pact-blade', 'eldritch-smite'], { ...base, pactSlots: [{ level: 3, current: 0, max: 2 }] }), 'epeelongue')).toBeNull();
    expect(eldritchSmiteOffer(warlock(['pact-blade', 'eldritch-smite'], { ...base, turn: { eldritchSmiteUsed: true } }), 'epeelongue')).toBeNull();
  });

  it('Décharge occulte crée des rayons séparés aux paliers de sort mineur', () => {
    expect(eldritchBlastBeamCount(1)).toBe(1);
    expect(eldritchBlastBeamCount(5)).toBe(2);
    expect(eldritchBlastBeamCount(11)).toBe(3);
    expect(eldritchBlastBeamCount(17)).toBe(4);
    expect(attackRollCountForCantrip('explosion-occulte', 5)).toBe(2);
  });

  it('Décharge agonisante s’affiche rayon par rayon sur Décharge occulte', () => {
    const ch = warlock(['agonizing-blast@explosion-occulte']);
    expect(agonizingCantripDamageDisplay(ch, 'explosion-occulte', 5, '2d10')).toBe('2 × (1d10+4)');
  });

  it('Lance occulte augmente la portée de 9 m par niveau d’Occultiste', () => {
    const ch = warlock(['eldritch-spear@explosion-occulte']);
    expect(effectiveEldritchSpearRangeMeters(ch, 'explosion-occulte', '36 m')).toBe(81);
  });

  it('Décharge répulsive propose 3 m de poussée pour chacun des deux rayons au niveau 5', () => {
    const ch = warlock(['repelling-blast@explosion-occulte']);
    expect(repellingBlastResolution(ch, 'explosion-occulte', 5)).toEqual({
      pushMeters: 3,
      attackRolls: 2,
      maximumTargetSize: 'Grande',
    });
  });

  it('les anciennes données d’Invocation scalaire restent reconnues', () => {
    const ch = warlock('eldritch-spear@explosion-occulte');
    expect(effectiveEldritchSpearRangeMeters(ch, 'explosion-occulte', '36 m')).toBe(81);
  });
});
