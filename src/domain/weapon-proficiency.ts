import type { WeaponDef } from '../content/weapons';

/**
 * Maîtrise des armes, par classe — PHB 2024, table « Entraînement au combat »
 * de chaque classe. Absente jusqu'ici : le catalogue d'armes existait déjà
 * (`content/weapons.ts`), mais rien ne savait dire qui a le droit de s'en
 * servir sans désavantage caché — une attaque affichée sans bonus de
 * maîtrise pour un Rôdeur aurait été aussi fausse qu'une attaque manquante.
 *
 * `martial`  : toutes les armes, simples et martiales.
 * `simple`   : uniquement les armes simples.
 * `specific` : des armes martiales nommées, en plus de ce que donnent les
 *              deux champs précédents — le Barde et le Roublard ont un petit
 *              lot d'armes de finesse, l'Ensorceleur et le Magicien un lot
 *              minimal indépendant de `simple`.
 */
export interface WeaponProficiencyRule {
  simple: boolean;
  martial: boolean;
  specific: string[];
}

const aucune: WeaponProficiencyRule = { simple: false, martial: false, specific: [] };
const simples = (specific: string[] = []): WeaponProficiencyRule => ({ simple: true, martial: false, specific });
const toutes: WeaponProficiencyRule = { simple: true, martial: true, specific: [] };

/** Épée courte, rapière, épée longue, arbalète de poing — le lot classique « armes de finesse ». */
const LOT_FINESSE = ['epeecourte', 'rapiere', 'epeelongue', 'arbalemain'];
/** Dague, fléchette, fronde, bâton, arbalète légère — le lot minimal des lanceurs sans entraînement martial. */
const LOT_LANCEUR = ['dague', 'flechette', 'fronde', 'baton', 'arbalegere'];

export const WEAPON_PROFICIENCY_BY_CLASS: Record<string, WeaponProficiencyRule> = {
  barbare: toutes,
  barde: simples(LOT_FINESSE),
  clerc: simples(),
  druide: simples(),
  guerrier: toutes,
  moine: simples(['epeecourte']),
  paladin: toutes,
  rodeur: toutes,
  roublard: simples(LOT_FINESSE),
  ensorceleur: { ...aucune, specific: LOT_LANCEUR },
  occultiste: simples(),
  magicien: { ...aucune, specific: LOT_LANCEUR },
};

/**
 * Maîtrisé si N'IMPORTE LAQUELLE des classes du personnage le donne — l'union,
 * pas l'intersection. Une nuance du multiclassage (certaines classes
 * n'apportent qu'un entraînement réduit en entrant en cours de route) reste
 * ignorée : assez juste pour les personnages réels de la table, pas pour
 * chaque combinaison exotique possible.
 */
export function isProficientWithWeapon(
  classIds: readonly string[],
  weapon: Pick<WeaponDef, 'id' | 'cat'>,
): boolean {
  return classIds.some((classId) => {
    const regle = WEAPON_PROFICIENCY_BY_CLASS[classId];
    if (!regle) return false;
    if (regle.martial) return true;
    if (regle.simple && weapon.cat === 'simple') return true;
    return regle.specific.includes(weapon.id);
  });
}
