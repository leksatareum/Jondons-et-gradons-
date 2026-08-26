import { describe, expect, it } from 'vitest';
import { isProficientWithWeapon } from './weapon-proficiency';
import { weaponById } from '../content/weapons';

describe('maîtrise des armes par classe', () => {
  it('un Guerrier est maîtrisé avec toute arme, simple ou martiale', () => {
    expect(isProficientWithWeapon(['guerrier'], weaponById('epeelongue')!)).toBe(true);
    expect(isProficientWithWeapon(['guerrier'], weaponById('dague')!)).toBe(true);
  });

  it('un Clerc n’est maîtrisé qu’avec les armes simples', () => {
    expect(isProficientWithWeapon(['clerc'], weaponById('gourdin')!)).toBe(true);
    expect(isProficientWithWeapon(['clerc'], weaponById('epeelongue')!)).toBe(false);
  });

  it('un Roublard ajoute son lot d’armes de finesse aux armes simples', () => {
    expect(isProficientWithWeapon(['roublard'], weaponById('rapiere')!)).toBe(true);
    expect(isProficientWithWeapon(['roublard'], weaponById('hachedarme')!)).toBe(false);
  });

  it('un Magicien n’a que son lot minimal, indépendant des armes simples', () => {
    expect(isProficientWithWeapon(['magicien'], weaponById('dague')!)).toBe(true);
    expect(isProficientWithWeapon(['magicien'], weaponById('gourdin')!)).toBe(false);
  });

  it('multiclassé : l’union des classes suffit, la meilleure gagne', () => {
    expect(isProficientWithWeapon(['magicien', 'guerrier'], weaponById('epeelongue')!)).toBe(true);
  });

  it('classe inconnue : jamais maîtrisé', () => {
    expect(isProficientWithWeapon(['inconnue'], weaponById('dague')!)).toBe(false);
  });
});
