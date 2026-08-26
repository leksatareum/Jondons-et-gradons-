import { weaponById, WEAPON_MASTERIES, type WeaponDef } from '../content/weapons';
import { isProficientWithWeapon } from './weapon-proficiency';
import { damageBonusFor, greatWeaponFightingNote, toHitBonusFor, unarmedDamageDie } from './fighting-styles';

/**
 * Une attaque prête à jouer : ce qu'une carte de combat affiche déjà pour un
 * sort (bonus, dégâts) mais pour une arme — au corps à corps ou à distance.
 *
 * Le catalogue d'armes (`content/weapons.ts`), la maîtrise par classe et la
 * progression d'Attaque supplémentaire (`domain/multiclassing.ts`) existaient
 * déjà, chacun de son côté, sans jamais se rejoindre en une seule attaque
 * jouable : c'était tout le trou signalé — l'écran de combat ne savait
 * montrer QUE des sorts.
 */
export interface WeaponAttack {
  id: string;
  name: string;
  melee: boolean;
  /** Bonus au toucher, maîtrise comprise si le personnage l'a. */
  toHit: number;
  /** Formule affichée telle quelle : « 1d8+3 », ou un montant fixe comme la sarbacane. */
  damage: string;
  /** Propriétés telles qu'écrites au catalogue — « Finesse, légère »… */
  properties: string;
  /** Nom de la maîtrise PHB 2024 associée à cette arme, pour information. */
  mastery: string;
  masteryDesc: string;
  proficient: boolean;
}

/**
 * L'attaque à mains nues, toujours disponible — PHB 2024 : 1 + mod par
 * défaut. Avec le style Combat à mains nues, un vrai dé remplace le
 * forfait : 1d6, ou 1d8 si vraiment aucune arme ni bouclier n'est en main.
 */
export function unarmedStrikeAttack(
  strModifier: number,
  proficiencyBonus: number,
  styles: ReadonlySet<string> = new Set(),
  hasWeaponOrShield = true,
): WeaponAttack {
  const die = unarmedDamageDie(styles, hasWeaponOrShield);
  return {
    id: 'mains-nues',
    name: 'Attaque à mains nues',
    melee: true,
    toHit: strModifier + proficiencyBonus,
    damage: die ? `1d${die}${strModifier !== 0 ? (strModifier >= 0 ? `+${strModifier}` : strModifier) : ''}` : `${Math.max(1, 1 + strModifier)}`,
    properties: 'contondants',
    mastery: '',
    masteryDesc: '',
    proficient: true,
  };
}

const signe = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

/**
 * L'attaque pour une arme donnée du catalogue.
 *
 * Caractéristique : Force par défaut, Dextérité pour une arme à distance,
 * la meilleure des deux pour une arme de Finesse — PHB 2024, glossaire
 * « Finesse ». Les dégâts utilisent le même modificateur que le toucher :
 * c'est la même caractéristique qui frappe et qui blesse.
 *
 * `styles` : les styles de combat choisis (`fighting-styles.ts`) — vide par
 * défaut, pour ne rien casser là où l'appelant ne les connaît pas encore.
 */
export function weaponAttackFor(
  weapon: WeaponDef,
  /** Modificateurs déjà calculés (`derived.modifiers`), pas des scores bruts. */
  modifiers: { str: number; dex: number },
  proficiencyBonus: number,
  classIds: readonly string[],
  styles: ReadonlySet<string> = new Set(),
  /**
   * Les armes sur lesquelles la maîtrise PHB 2024 s'applique vraiment —
   * celles choisies via la décision « Maîtrise d'armes »
   * (`model/choix-de-classe.ts`, `armesAvecMaitriseActive`).
   *
   * Vide par défaut pour ne rien casser côté appelants qui ne la
   * connaissent pas encore ; dans ce cas aucune arme n'affiche de maîtrise,
   * ce qui est le comportement correct tant que rien n'a été choisi — la
   * maîtrise n'est jamais accordée d'office.
   */
  maitrisesActives: ReadonlySet<string> = new Set(),
): WeaponAttack {
  const mod = weapon.finesse
    ? Math.max(modifiers.str, modifiers.dex)
    : weapon.melee ? modifiers.str : modifiers.dex;
  const proficient = isProficientWithWeapon(classIds, weapon);
  const toHit = mod + (proficient ? proficiencyBonus : 0) + toHitBonusFor(styles, weapon);
  const modDegats = mod + damageBonusFor(styles, weapon);
  const base = weapon.fixed !== undefined ? `${weapon.fixed}` : `${weapon.diceCount ?? 1}d${weapon.die}`;
  const damage = weapon.fixed !== undefined ? base : `${base}${modDegats !== 0 ? signe(modDegats) : ''}`;
  const maitriseActive = maitrisesActives.has(weapon.id);
  const masterie = maitriseActive ? WEAPON_MASTERIES[weapon.mastery] : undefined;
  const note = greatWeaponFightingNote(styles, weapon);
  return {
    id: `arme-${weapon.id}`,
    name: weapon.name,
    melee: weapon.melee,
    toHit,
    damage,
    properties: note ? `${weapon.props} · ${note}` : weapon.props,
    mastery: maitriseActive ? weapon.mastery : '',
    masteryDesc: masterie?.desc ?? '',
    proficient,
  };
}

/** Résout un id de catalogue en `WeaponAttack`, ou `null` si l'id est inconnu — jamais d'attaque inventée. */
export function weaponAttackForId(
  weaponId: string,
  modifiers: { str: number; dex: number },
  proficiencyBonus: number,
  classIds: readonly string[],
  styles: ReadonlySet<string> = new Set(),
  maitrisesActives: ReadonlySet<string> = new Set(),
): WeaponAttack | null {
  const weapon = weaponById(weaponId);
  return weapon ? weaponAttackFor(weapon, modifiers, proficiencyBonus, classIds, styles, maitrisesActives) : null;
}
