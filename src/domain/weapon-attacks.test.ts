import { describe, expect, it } from 'vitest';
import { unarmedStrikeAttack, weaponAttackFor, weaponAttackForId } from './weapon-attacks';
import { weaponById } from '../content/weapons';

describe('attaque à mains nues', () => {
  it('1 + modificateur de Force, jamais moins que 1', () => {
    expect(unarmedStrikeAttack(3, 2).damage).toBe('4');
    expect(unarmedStrikeAttack(3, 2).toHit).toBe(5);
  });

  it('plancher à 1 même avec un modificateur négatif', () => {
    expect(unarmedStrikeAttack(-3, 2).damage).toBe('1');
  });
});

// `weaponAttackFor` prend des MODIFICATEURS déjà calculés (`derived.modifiers`
// côté appelant), pas des scores bruts — comme le reste de la dérivation.

describe('attaque à l’arme — corps à corps', () => {
  it('épée longue : Force au toucher et aux dégâts, maîtrisée par un Guerrier', () => {
    const epee = weaponById('epeelongue')!;
    const attaque = weaponAttackFor(epee, { str: 3, dex: 0 }, 2, ['guerrier']);
    expect(attaque.melee).toBe(true);
    expect(attaque.toHit).toBe(3 + 2); // mod FOR +3, maîtrisée +2
    expect(attaque.damage).toBe('1d8+3');
    expect(attaque.proficient).toBe(true);
  });

  it('non maîtrisée : le bonus de maîtrise ne s’applique pas', () => {
    const hache = weaponById('hachedarme')!;
    const attaque = weaponAttackFor(hache, { str: 2, dex: 0 }, 3, ['magicien']);
    expect(attaque.proficient).toBe(false);
    expect(attaque.toHit).toBe(2); // seulement le mod FOR +2
  });
});

describe('attaque à l’arme — Finesse et à distance', () => {
  it('rapière (Finesse) : prend le meilleur de Force et Dextérité', () => {
    const rapiere = weaponById('rapiere')!;
    const attaque = weaponAttackFor(rapiere, { str: -1, dex: 3 }, 2, ['roublard']);
    expect(attaque.toHit).toBe(3 + 2); // DEX +3 > FOR -1
    expect(attaque.damage).toBe('1d8+3');
  });

  it('arc long : Dextérité, jamais Force', () => {
    const arc = weaponById('arclong')!;
    const attaque = weaponAttackFor(arc, { str: 4, dex: 1 }, 2, ['rodeur']);
    expect(attaque.melee).toBe(false);
    expect(attaque.toHit).toBe(1 + 2); // DEX +1, pas FOR +4
    expect(attaque.damage).toBe('1d8+1');
  });

  it('sarbacane : dégâts fixes, sans modificateur ajouté', () => {
    const sarbacane = weaponById('sarbacane')!;
    const attaque = weaponAttackFor(sarbacane, { str: 0, dex: 4 }, 2, ['guerrier']);
    expect(attaque.damage).toBe('1');
  });
});

describe('résolution par id', () => {
  it('un id connu renvoie une attaque', () => {
    expect(weaponAttackForId('dague', { str: 0, dex: 2 }, 2, ['roublard'])).not.toBeNull();
  });

  it('un id inconnu renvoie null plutôt qu’une attaque inventée', () => {
    expect(weaponAttackForId('rien-du-tout', { str: 0, dex: 2 }, 2, [])).toBeNull();
  });
});
