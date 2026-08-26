import type { WeaponDef } from '../content/weapons';

/**
 * Styles de combat — leur effet sur une attaque, enfin appliqué.
 *
 * Le catalogue (`content/fighting-styles.ts`) existait, le choix se
 * sauvegardait sur la fiche (`classChoices.<classe>.fightingStyle`) — mais
 * rien ne le relisait jamais : un Rôdeur qui prenait Archerie gardait le
 * même bonus au toucher à distance qu'un Rôdeur qui n'avait rien choisi.
 *
 * Seuls les styles qui changent un NOMBRE affiché sur une carte d'attaque
 * vivent ici. Les réactions (Interception, Protection), la perception
 * aveugle et le combat à deux armes (aucune carte d'attaque secondaire dans
 * cette appli) restent du texte à appliquer à la table — comme le reste des
 * déclencheurs situationnels que l'application ne motorise pas.
 */

/** Les styles choisis, tous classes confondues — un multiclassé peut en tenir plus d'un. */
export function chosenFightingStyles(
  classChoices: Record<string, Record<string, string | string[] | null | undefined>>,
): ReadonlySet<string> {
  const styles = new Set<string>();
  for (const choices of Object.values(classChoices)) {
    const style = choices?.fightingStyle;
    if (typeof style === 'string') styles.add(style);
  }
  return styles;
}

const uneMain = (weapon: Pick<WeaponDef, 'props'>): boolean => !/deux mains/i.test(weapon.props);
const lancable = (weapon: Pick<WeaponDef, 'props'>): boolean => /lancer/i.test(weapon.props);

/** +2 au toucher à distance — Archerie. */
export function toHitBonusFor(styles: ReadonlySet<string>, weapon: Pick<WeaponDef, 'melee'>): number {
  return styles.has('archerie') && !weapon.melee ? 2 : 0;
}

/**
 * +2 aux dégâts — Duel (corps à corps à une main) ou Armes de jet, jamais
 * les deux à la fois sur une même carte : cette appli ne distingue pas une
 * arme lancée d'une arme frappée au corps à corps, la carte étant unique
 * par arme. Ce n'est ambigu que si un personnage tenait les DEUX styles à
 * la fois (multiclassage rare) ; le plafond à +2 évite de les cumuler.
 */
export function damageBonusFor(styles: ReadonlySet<string>, weapon: Pick<WeaponDef, 'melee' | 'props'>): number {
  const duel = styles.has('duel') && weapon.melee && uneMain(weapon);
  const lancer = styles.has('lancer') && lancable(weapon);
  return duel || lancer ? 2 : 0;
}

/** Armes à deux mains : rejoue les 1 et 2 des dés de dégâts — non chiffrable ici, juste un rappel. */
export function greatWeaponFightingNote(styles: ReadonlySet<string>, weapon: Pick<WeaponDef, 'props'>): string | null {
  return styles.has('grandes') && /deux mains/i.test(weapon.props) ? 'rejoue les 1 et 2 aux dégâts' : null;
}

/**
 * Combat à mains nues : 1d6 + Force au lieu du forfait « 1 + Force », 1d8 si
 * ni arme ni bouclier en main.
 */
export function unarmedDamageDie(styles: ReadonlySet<string>, hasWeaponOrShield: boolean): 6 | 8 | null {
  if (!styles.has('mainsnues')) return null;
  return hasWeaponOrShield ? 6 : 8;
}

/** +1 à la classe d'armure — Défense, seulement en armure (pas à mains nues ni en Forme sauvage). */
export function armorClassBonusFor(styles: ReadonlySet<string>, wearingArmor: boolean): number {
  return styles.has('defense') && wearingArmor ? 1 : 0;
}
