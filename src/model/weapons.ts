import { weaponById, type WeaponDef } from '../content/weapons';
import { ownedWeapons } from '../domain/weapon-ownership';
import { unarmedStrikeAttack, weaponAttackFor, type WeaponAttack } from '../domain/weapon-attacks';
import { multiclassAttacksPerAction } from '../domain/multiclassing';
import type { CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Les armes en main, greffées sur `CharacterSheet` — même principe que
 * `model/companions.ts` : le domaine calcule, ce module ne fait que le
 * brancher sur la fiche et donner un type précis à ce qu'il manipule.
 *
 * On ne peut mettre en main qu'une arme qu'on POSSÈDE — reconnue dans le sac
 * (`domain/weapon-ownership.ts`), équipement de départ ou trouvaille en jeu.
 * Jamais le catalogue entier : ce serait autoriser n'importe quel personnage
 * à se présenter au combat avec une arme qu'il n'a jamais eue.
 */

const possedees = (sheet: CharacterSheet): WeaponDef[] => ownedWeapons(sheet.inventory);

/**
 * Les armes en main, résolues et VALIDÉES contre le sac — un id qui y était
 * mais dont l'objet a disparu du sac depuis (vendu, perdu, donné) sort de la
 * liste sans qu'il faille y penser : la possession fait foi à chaque lecture,
 * jamais figée au moment où l'arme a été mise en main.
 */
export function armesPortees(sheet: CharacterSheet): WeaponDef[] {
  const possible = new Set(possedees(sheet).map((weapon) => weapon.id));
  return (sheet.weaponIds ?? [])
    .map(weaponById)
    .filter((weapon): weapon is WeaponDef => Boolean(weapon) && possible.has(weapon!.id));
}

/** Ce qui peut encore être mis en main : possédé, pas déjà en main. */
export function armesAAjouter(sheet: CharacterSheet): WeaponDef[] {
  const enMain = new Set(sheet.weaponIds ?? []);
  return possedees(sheet)
    .filter((weapon) => !enMain.has(weapon.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/** Refuse une arme non possédée — la liste proposée à l'écran l'exclut déjà, ceci n'est qu'un garde-fou. */
export function ajouterArme(sheet: CharacterSheet, weaponId: string): CharacterSheet {
  const estPossedee = possedees(sheet).some((weapon) => weapon.id === weaponId);
  if (!estPossedee || (sheet.weaponIds ?? []).includes(weaponId)) return sheet;
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
  const attaques = armes.map((weapon) => weaponAttackFor(weapon, modifiers, derived.proficiencyBonus, classIds));
  return [
    ...attaques,
    unarmedStrikeAttack(derived.modifiers.str, derived.proficiencyBonus),
  ];
}

/** Nombre d'attaques par Action — PHB 2024 « Attaque supplémentaire ». 1 hors de toute progression connue. */
export const attaquesParAction = (sheet: CharacterSheet): number =>
  multiclassAttacksPerAction(sheet.classLevels);
