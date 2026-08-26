import { describe, expect, it } from 'vitest';
import {
  armorClassBonusFor, chosenFightingStyles, damageBonusFor, greatWeaponFightingNote,
  toHitBonusFor, unarmedDamageDie,
} from './fighting-styles';
import { weaponById } from '../content/weapons';

describe('styles choisis — tous classes confondues', () => {
  it('lit fightingStyle sous n’importe quelle classe', () => {
    const styles = chosenFightingStyles({ rodeur: { fightingStyle: 'archerie' } });
    expect(styles.has('archerie')).toBe(true);
  });

  it('rien de choisi : ensemble vide', () => {
    expect(chosenFightingStyles({ rodeur: {} }).size).toBe(0);
  });

  it('un multiclassé peut tenir deux styles', () => {
    const styles = chosenFightingStyles({ rodeur: { fightingStyle: 'archerie' }, guerrier: { fightingStyle: 'duel' } });
    expect(styles.has('archerie')).toBe(true);
    expect(styles.has('duel')).toBe(true);
  });
});

describe('Archerie — +2 au toucher à distance seulement', () => {
  it('bonus sur l’arc long', () => {
    const styles = new Set(['archerie']);
    expect(toHitBonusFor(styles, weaponById('arclong')!)).toBe(2);
  });

  it('aucun bonus au corps à corps', () => {
    const styles = new Set(['archerie']);
    expect(toHitBonusFor(styles, weaponById('epeelongue')!)).toBe(0);
  });

  it('sans le style : rien', () => {
    expect(toHitBonusFor(new Set(), weaponById('arclong')!)).toBe(0);
  });
});

describe('Duel et Armes de jet — +2 aux dégâts', () => {
  it('Duel : arme de corps à corps à une main', () => {
    const styles = new Set(['duel']);
    expect(damageBonusFor(styles, weaponById('epeecourte')!)).toBe(2);
  });

  it('Duel : rien sur une arme à deux mains', () => {
    const styles = new Set(['duel']);
    expect(damageBonusFor(styles, weaponById('grandehache')!)).toBe(0);
  });

  it('Armes de jet : arme avec la propriété lancer', () => {
    const styles = new Set(['lancer']);
    expect(damageBonusFor(styles, weaponById('hachette')!)).toBe(2);
  });

  it('jamais cumulé à +4, même avec les deux styles', () => {
    const styles = new Set(['duel', 'lancer']);
    expect(damageBonusFor(styles, weaponById('hachette')!)).toBe(2);
  });
});

describe('Armes à deux mains — rappel, pas de chiffre', () => {
  it('note affichée sur une arme à deux mains', () => {
    expect(greatWeaponFightingNote(new Set(['grandes']), weaponById('grandehache')!)).toMatch(/rejoue/);
  });

  it('rien sur une arme à une main', () => {
    expect(greatWeaponFightingNote(new Set(['grandes']), weaponById('epeecourte')!)).toBeNull();
  });
});

describe('Combat à mains nues — le dé change', () => {
  it('1d6 avec une arme ou un bouclier en main', () => {
    expect(unarmedDamageDie(new Set(['mainsnues']), true)).toBe(6);
  });

  it('1d8 mains vraiment nues', () => {
    expect(unarmedDamageDie(new Set(['mainsnues']), false)).toBe(8);
  });

  it('sans le style : pas de changement (forfait habituel)', () => {
    expect(unarmedDamageDie(new Set(), false)).toBeNull();
  });
});

describe('Défense — +1 CA en armure seulement', () => {
  it('bonus en armure', () => {
    expect(armorClassBonusFor(new Set(['defense']), true)).toBe(1);
  });

  it('rien sans armure', () => {
    expect(armorClassBonusFor(new Set(['defense']), false)).toBe(0);
  });
});
