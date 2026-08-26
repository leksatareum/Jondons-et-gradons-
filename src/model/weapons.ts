import { weaponById, type WeaponDef } from '../content/weapons';
import { ownedWeapons } from '../domain/weapon-ownership';
import { unarmedStrikeAttack, weaponAttackFor, type WeaponAttack } from '../domain/weapon-attacks';
import { multiclassAttacksPerAction } from '../domain/multiclassing';
import type { CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';

/**
 * L'arme en main, greffée sur `CharacterSheet` — même principe que
 * `model/companions.ts` : le domaine calcule, ce module ne fait que le
 * brancher sur la fiche et donner un type précis à ce qu'il manipule.
 *
 * Une seule arme en main à la fois, et seulement parmi ce qu'on POSSÈDE —
 * reconnu dans le sac (`domain/weapon-ownership.ts`), équipement de départ ou
 * trouvaille en jeu. Jamais le catalogue entier : ce serait autoriser
 * n'importe quel personnage à se présenter au combat avec une arme qu'il n'a
 * jamais eue, ou à manier deux armes à la fois sans jamais en reposer une.
 */

const possedees = (sheet: CharacterSheet): WeaponDef[] => ownedWeapons(sheet.inventory);

/**
 * L'arme en main, résolue et VALIDÉE contre le sac — perdue du sac (vendue,
 * donnée) depuis qu'elle a été équipée, elle redevient `null` sans qu'il
 * faille y penser : la possession fait foi à chaque lecture, jamais figée au
 * moment où l'arme a été mise en main.
 */
export function armeEnMain(sheet: CharacterSheet): WeaponDef | null {
  const id = sheet.equippedWeaponId;
  if (!id) return null;
  const arme = possedees(sheet).find((weapon) => weapon.id === id);
  return arme ?? null;
}

/** Ce qui peut être équipé à la place de l'arme actuelle : possédé, pas déjà en main. */
export function armesEquipables(sheet: CharacterSheet): WeaponDef[] {
  const actuelle = sheet.equippedWeaponId;
  return possedees(sheet)
    .filter((weapon) => weapon.id !== actuelle)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/** Équipe une arme possédée — remplace l'ancienne, ne s'y ajoute jamais. Refuse une arme non possédée. */
export function equiperArme(sheet: CharacterSheet, weaponId: string): CharacterSheet {
  if (sheet.equippedWeaponId === weaponId) return sheet;
  const estPossedee = possedees(sheet).some((weapon) => weapon.id === weaponId);
  if (!estPossedee) return sheet;
  return { ...sheet, equippedWeaponId: weaponId };
}

/** Repose l'arme en main : ne reste que l'attaque à mains nues. */
export function degainerArme(sheet: CharacterSheet): CharacterSheet {
  if (!sheet.equippedWeaponId) return sheet;
  return { ...sheet, equippedWeaponId: null };
}

/**
 * Les attaques jouables du personnage : à mains nues, toujours présente, puis
 * celle de l'arme en main s'il y en a une. Le nombre d'attaques par Action
 * (Attaque supplémentaire) est indiqué sur chacune plutôt que dupliqué en
 * plusieurs cartes identiques — la table sait déjà ce qu'elle doit relancer.
 */
export function attaquesDuPersonnage(sheet: CharacterSheet, derived: DerivedCharacter): WeaponAttack[] {
  const classIds = sheet.classLevels.map((entry) => entry.classId);
  const modifiers = { str: derived.modifiers.str, dex: derived.modifiers.dex };
  const arme = armeEnMain(sheet);
  const attaques = arme ? [weaponAttackFor(arme, modifiers, derived.proficiencyBonus, classIds)] : [];
  return [
    ...attaques,
    unarmedStrikeAttack(derived.modifiers.str, derived.proficiencyBonus),
  ];
}

/** Nombre d'attaques par Action — PHB 2024 « Attaque supplémentaire ». 1 hors de toute progression connue. */
export const attaquesParAction = (sheet: CharacterSheet): number =>
  multiclassAttacksPerAction(sheet.classLevels);
