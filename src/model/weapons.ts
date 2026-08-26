import { WEAPONS, weaponById, type WeaponDef } from '../content/weapons';
import { unarmedStrikeAttack, weaponAttackFor, type WeaponAttack } from '../domain/weapon-attacks';
import { multiclassAttacksPerAction } from '../domain/multiclassing';
import type { CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Les armes en main, greffées sur `CharacterSheet` — même principe que
 * `model/companions.ts` : le domaine calcule, ce module ne fait que le
 * brancher sur la fiche et donner un type précis à ce qu'il manipule.
 */

/** Toutes les armes du catalogue, triées pour un sélecteur — simples d'abord, puis martiales, alphabétique dans chaque groupe. */
export const armesDuCatalogue = (): WeaponDef[] =>
  WEAPONS.slice().sort((a, b) => (a.cat === b.cat ? a.name.localeCompare(b.name, 'fr') : a.cat === 'simple' ? -1 : 1));

/** Les armes que porte le personnage, résolues depuis le catalogue — un id qui n'y est plus est silencieusement ignoré. */
export function armesPortees(sheet: CharacterSheet): WeaponDef[] {
  return (sheet.weaponIds ?? []).map(weaponById).filter((weapon): weapon is WeaponDef => Boolean(weapon));
}

export function ajouterArme(sheet: CharacterSheet, weaponId: string): CharacterSheet {
  if (!weaponById(weaponId) || (sheet.weaponIds ?? []).includes(weaponId)) return sheet;
  return { ...sheet, weaponIds: [...(sheet.weaponIds ?? []), weaponId] };
}

export function retirerArme(sheet: CharacterSheet, weaponId: string): CharacterSheet {
  return { ...sheet, weaponIds: (sheet.weaponIds ?? []).filter((id) => id !== weaponId) };
}

/**
 * Toutes les attaques jouables du personnage : à mains nues, toujours
 * présente, puis une par arme en main. Le nombre d'attaques par Action
 * (Attaque supplémentaire) est indiqué sur chacune plutôt que dupliqué en
 * plusieurs cartes identiques — la table sait déjà ce qu'elle doit relancer.
 */
export function attaquesDuPersonnage(sheet: CharacterSheet, derived: DerivedCharacter): WeaponAttack[] {
  const classIds = sheet.classLevels.map((entry) => entry.classId);
  const modifiers = { str: derived.modifiers.str, dex: derived.modifiers.dex };
  const armes = armesPortees(sheet);
  const attaques = armes.length > 0
    ? armes.map((weapon) => weaponAttackFor(weapon, modifiers, derived.proficiencyBonus, classIds))
    : [];
  return [
    ...attaques,
    unarmedStrikeAttack(derived.modifiers.str, derived.proficiencyBonus),
  ];
}

/** Nombre d'attaques par Action — PHB 2024 « Attaque supplémentaire ». 1 hors de toute progression connue. */
export const attaquesParAction = (sheet: CharacterSheet): number =>
  multiclassAttacksPerAction(sheet.classLevels);
