import { describe, expect, it } from 'vitest';
import {
  activeEldritchHex,
  awakenedMindBondWithClairvoyantTrigger,
  clairvoyantCombatantAttackAdvantage,
  contactPatronEligible,
  greatOldOneSpellSaveDc,
  moveEldritchHexTarget,
  resolveClairvoyantCombatant,
  restoreClairvoyantCombatantWithPactMagic,
  setEldritchHexTarget,
  thoughtShieldActive,
  thoughtShieldReflection,
} from './warlock-great-old-one-levels-6-10';

const goo = (level = 10, extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  level,
  classLevels: [{ classId: 'occultiste', level, subclass: 'Patron Grand Ancien' }],
  abilities: { cha: 18 },
  resources: level >= 6 ? [{ name: 'Combattant clairvoyant', current: 1, max: 1, recharge: 'court' }] : [],
  pactSlots: [{ level: level >= 9 ? 5 : 3, current: 2, max: 2 }],
  conditions: [],
  turn: { action: false, bonus: false, reaction: false },
  ...extra,
});

describe('Patron Grand Ancien PHB 2024 niveaux 6 à 10', () => {
  it('calcule le DD de Combattant clairvoyant avec le niveau total et le Charisme', () => {
    expect(greatOldOneSpellSaveDc(goo(6))).toBe(15); // maîtrise +3, CHA +4
    const multiclass = goo(6, {
      level: 10,
      classLevels: [
        { classId: 'occultiste', level: 6, subclass: 'Patron Grand Ancien' },
        { classId: 'guerrier', level: 4 },
      ],
    });
    expect(greatOldOneSpellSaveDc(multiclass)).toBe(16); // maîtrise +4, CHA +4
  });

  it('propose Combattant clairvoyant uniquement à la création d’un nouveau lien Esprit éveillé si l’usage est disponible', () => {
    const bond = awakenedMindBondWithClairvoyantTrigger(goo(6), { targetName: 'Aldric' });
    expect(bond.clairvoyantCombatantPending).toBe(true);
    expect(bond.clairvoyantCombatantActive).toBe(false);

    const spent = goo(6, { resources: [{ name: 'Combattant clairvoyant', current: 0, max: 1, recharge: 'court' }] });
    expect(awakenedMindBondWithClairvoyantTrigger(spent, { targetName: 'Aldric' }).clairvoyantCombatantPending).toBe(false);
  });

  it('consomme l’unique usage et n’active avantage/désavantage que sur un échec de sauvegarde', () => {
    const pending = goo(6, { awakenedMindBond: { targetName: 'Aldric', clairvoyantCombatantPending: true } });
    const failed = resolveClairvoyantCombatant(pending, true);
    expect(failed.resources?.[0].current).toBe(0);
    expect(failed.awakenedMindBond?.clairvoyantCombatantActive).toBe(true);
    expect(clairvoyantCombatantAttackAdvantage(failed, 'Aldric')).toBe(true);
    expect(clairvoyantCombatantAttackAdvantage(failed, 'Corvin')).toBe(false);

    const succeeded = resolveClairvoyantCombatant(pending, false);
    expect(succeeded.resources?.[0].current).toBe(0);
    expect(succeeded.awakenedMindBond?.clairvoyantCombatantActive).toBe(false);
  });

  it('restaure Combattant clairvoyant avec un emplacement de pacte sans action', () => {
    const spent = goo(6, {
      resources: [{ name: 'Combattant clairvoyant', current: 0, max: 1, recharge: 'court' }],
      pactSlots: [{ level: 3, current: 2, max: 2 }],
      turn: { action: true, bonus: true, reaction: true },
    });
    const restored = restoreClairvoyantCombatantWithPactMagic(spent);
    expect(restored.resources?.[0].current).toBe(1);
    expect(restored.pactSlots?.[0].current).toBe(1);
    expect(restored.turn).toEqual(spent.turn);
  });

  it('Bouclier mental est actif au niveau 10 et renvoie exactement les dégâts psychiques réellement subis', () => {
    expect(thoughtShieldActive(goo(9))).toBe(false);
    expect(thoughtShieldActive(goo(10))).toBe(true);
    expect(thoughtShieldReflection(goo(10), 7, 'Psychique')).toBe(7);
    expect(thoughtShieldReflection(goo(10), 7, 'Feu')).toBe(0);
  });

  it('Maléfice occulte n’est actif que pendant la concentration sur Maléfice', () => {
    const marked = setEldritchHexTarget(goo(10), 'Aldric', 'wis');
    expect(activeEldritchHex(marked)).toBeNull();
    const concentrating = {
      ...marked,
      conditions: [{ label: 'Concentration', detail: 'Maléfice' }],
    };
    expect(activeEldritchHex(concentrating)).toEqual({ targetName: 'Aldric', ability: 'wis' });
  });

  it('déplacer Maléfice conserve la caractéristique et consomme l’action bonus', () => {
    const concentrating = setEldritchHexTarget(goo(10, {
      conditions: [{ label: 'Concentration', detail: 'Maléfice' }],
    }), 'Aldric', 'con');
    const moved = moveEldritchHexTarget(concentrating, 'Corvin');
    expect(moved.greatOldOneHex).toEqual({ targetName: 'Corvin', ability: 'con' });
    expect(moved.turn?.bonus).toBe(true);
  });

  it('Contact du Patron devient disponible au niveau 9 pour tout Occultiste', () => {
    expect(contactPatronEligible(goo(8))).toBe(false);
    expect(contactPatronEligible(goo(9))).toBe(true);
    expect(contactPatronEligible({
      classId: 'occultiste',
      level: 9,
      subclass: 'Patron Fiélon',
      classLevels: [{ classId: 'occultiste', level: 9, subclass: 'Patron Fiélon' }],
    })).toBe(true);
  });
});
