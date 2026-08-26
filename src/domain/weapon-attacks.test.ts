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

describe('styles de combat — enfin appliqués à l’attaque', () => {
  it('Archerie : +2 au toucher à l’arc, rien à l’épée', () => {
    const styles = new Set(['archerie']);
    const arc = weaponAttackFor(weaponById('arclong')!, { str: 0, dex: 3 }, 2, ['rodeur'], styles);
    expect(arc.toHit).toBe(3 + 2 + 2); // DEX +3, maîtrise +2, Archerie +2
    const epee = weaponAttackFor(weaponById('epeelongue')!, { str: 3, dex: 0 }, 2, ['rodeur'], styles);
    expect(epee.toHit).toBe(3 + 2); // pas de bonus au corps à corps
  });

  it('Duel : +2 aux dégâts d’une arme à une main, rien à deux mains', () => {
    const styles = new Set(['duel']);
    const courte = weaponAttackFor(weaponById('epeecourte')!, { str: 3, dex: 0 }, 2, ['guerrier'], styles);
    expect(courte.damage).toBe('1d6+5'); // FOR +3 +2 Duel
    const hache = weaponAttackFor(weaponById('grandehache')!, { str: 3, dex: 0 }, 2, ['guerrier'], styles);
    expect(hache.damage).toBe('1d12+3'); // à deux mains, Duel ne s’applique pas
  });

  it('Armes de jet : +2 aux dégâts d’une arme qui se lance', () => {
    const styles = new Set(['lancer']);
    const hachette = weaponAttackFor(weaponById('hachette')!, { str: 2, dex: 0 }, 2, ['guerrier'], styles);
    expect(hachette.damage).toBe('1d6+4'); // FOR +2 +2 Armes de jet
  });

  it('Armes à deux mains : rappel dans les propriétés, sans changer les dégâts affichés', () => {
    const styles = new Set(['grandes']);
    const hache = weaponAttackFor(weaponById('grandehache')!, { str: 3, dex: 0 }, 2, ['guerrier'], styles);
    expect(hache.damage).toBe('1d12+3');
    expect(hache.properties).toMatch(/rejoue/);
  });

  it('mains nues avec Combat à mains nues : 1d6, ou 1d8 si vraiment aucune arme ni bouclier', () => {
    const styles = new Set(['mainsnues']);
    expect(unarmedStrikeAttack(3, 2, styles, true).damage).toBe('1d6+3');
    expect(unarmedStrikeAttack(3, 2, styles, false).damage).toBe('1d8+3');
  });

  it('sans le style, l’attaque à mains nues garde son forfait habituel', () => {
    expect(unarmedStrikeAttack(3, 2).damage).toBe('4');
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
