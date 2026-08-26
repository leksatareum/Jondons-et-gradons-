import { choiceList, choicesFor, levelInClass, type CharacterSheet } from './character';
import {
  eligibleInvocationOptions, invocationBaseId, invocationByOptionId,
  warlockInvocationCount,
} from '../content/eldritch-invocations';
import { spellById, spellsForClass, type Spell } from '../content/spell-catalogue';

/**
 * Invocations occultes et Arcanum mystique — les deux décisions que la montée
 * de niveau d'un Occultiste réclame et que le formulaire ne demandait pas.
 *
 * Le catalogue d'invocations existait déjà (`content/eldritch-invocations.ts`)
 * et n'était lu par personne : aucune fiche n'en portait, aucun écran n'en
 * proposait. Ce module le raccorde à `classChoices.occultiste`, où vivent les
 * choix de classe d'une fiche réelle.
 */

const CLE_INVOCATIONS = 'invocations';
const CLE_ARCANUM = 'arcanum';

export const niveauOccultisteDe = (sheet: CharacterSheet): number => levelInClass(sheet, 'occultiste');

// ═══════════════════════════════════════════════════════════════════════
// §21 — INVOCATIONS OCCULTES
// ═══════════════════════════════════════════════════════════════════════

export const invocationsChoisies = (sheet: CharacterSheet): string[] =>
  choiceList(choicesFor(sheet, 'occultiste'), CLE_INVOCATIONS);

/**
 * Nombre total d'invocations dû au niveau. Table PHB 2024 : 1 au niveau 1,
 * 3 au niveau 2, puis 5, 6, 7, 8, 9 et 10 aux niveaux 5, 7, 9, 12, 15 et 18.
 */
export const invocationsDues = (sheet: CharacterSheet): number => {
  const niveau = niveauOccultisteDe(sheet);
  return niveau >= 1 ? warlockInvocationCount(niveau) : 0;
};

/** Combien il en reste à choisir. Positif après un niveau qui augmente le total. */
export const invocationsAChoisir = (sheet: CharacterSheet): number =>
  Math.max(0, invocationsDues(sheet) - invocationsChoisies(sheet).length);

/**
 * Les sorts mineurs du personnage, pour les invocations qui se rattachent à
 * l'un d'eux (Décharge agonisante, Lance occulte, Décharge répulsive).
 *
 * Toutes les listes reçoivent les mêmes sorts mineurs : l'application n'a pas
 * de donnée structurée qui dise lequel inflige des dégâts ou porte une
 * attaque — le catalogue ne porte ce champ pour AUCUN sort (`spell-cards.ts`).
 * Deviner à partir du texte écarterait des sorts légitimes sans le dire. La
 * condition est donc rappelée dans le libellé de l'invocation, et le joueur
 * tranche.
 */
const sortsMineursDe = (sheet: CharacterSheet) =>
  sheet.cantrips
    .map((chosen) => spellById(chosen.id))
    .filter((spell): spell is Spell => spell != null)
    .map((spell) => ({ id: spell.id, name: spell.name }));

/** Les invocations que ce personnage peut prendre, hors celles déjà prises. */
export function invocationsDisponibles(
  sheet: CharacterSheet,
  originFeats: { id: string; name: string }[] = [],
): { id: string; name: string; desc: string }[] {
  const mineurs = sortsMineursDe(sheet);
  const dejaPrises = new Set(invocationsChoisies(sheet));
  return eligibleInvocationOptions({
    level: niveauOccultisteDe(sheet),
    selectedIds: invocationsChoisies(sheet),
    damageCantrips: mineurs,
    rangedDamageCantrips: mineurs,
    attackCantrips: mineurs,
    originFeats,
  }).filter((option) => !dejaPrises.has(option.id));
}

/**
 * Une invocation ne peut pas être retirée tant qu'une autre invocation
 * possédée l'exige comme prérequis : abandonner le Pacte de la Lame en
 * gardant Lame assoiffée laisserait une capacité sans son socle.
 */
export function peutRetirerInvocation(sheet: CharacterSheet, optionId: string): boolean {
  const base = invocationBaseId(optionId);
  const autres = invocationsChoisies(sheet).filter((id) => id !== optionId);
  return !autres.some((id) => invocationByOptionId(id)?.requires === base);
}

const avecInvocations = (sheet: CharacterSheet, invocations: string[]): CharacterSheet => ({
  ...sheet,
  classChoices: {
    ...sheet.classChoices,
    occultiste: { ...choicesFor(sheet, 'occultiste'), [CLE_INVOCATIONS]: invocations },
  },
});

export function ajouterInvocation(sheet: CharacterSheet, optionId: string): CharacterSheet {
  const actuelles = invocationsChoisies(sheet);
  if (actuelles.includes(optionId)) return sheet;
  return avecInvocations(sheet, [...actuelles, optionId]);
}

/**
 * Le remplacement offert à chaque niveau d'Occultiste : une invocation contre
 * une autre dont les prérequis sont remplis.
 */
export function remplacerInvocation(
  sheet: CharacterSheet,
  sortante: string,
  entrante: string,
): CharacterSheet {
  const actuelles = invocationsChoisies(sheet);
  if (!actuelles.includes(sortante)) return sheet;
  if (actuelles.includes(entrante)) return sheet;
  if (!peutRetirerInvocation(sheet, sortante)) return sheet;
  return avecInvocations(sheet, actuelles.map((id) => (id === sortante ? entrante : id)));
}

// ═══════════════════════════════════════════════════════════════════════
// §22 — ARCANUM MYSTIQUE
// ═══════════════════════════════════════════════════════════════════════

/** Le rang de sort que chaque palier ouvre. */
export const ARCANUM_PAR_NIVEAU: Record<number, number> = { 11: 6, 13: 7, 15: 8, 17: 9 };

/** Les rangs auxquels le personnage a droit, dans l'ordre. */
export function rangsArcanumDus(sheet: CharacterSheet): number[] {
  const niveau = niveauOccultisteDe(sheet);
  return Object.entries(ARCANUM_PAR_NIVEAU)
    .filter(([palier]) => niveau >= Number(palier))
    .map(([, rang]) => rang);
}

/** Stocké « rang:sort », pour qu'un Arcanum sache toujours de quel palier il vient. */
export interface Arcanum {
  rank: number;
  spellId: string;
}

export function arcanumChoisis(sheet: CharacterSheet): Arcanum[] {
  return choiceList(choicesFor(sheet, 'occultiste'), CLE_ARCANUM)
    .map((entree) => {
      const [rang, spellId] = entree.split(':');
      return { rank: Number(rang), spellId };
    })
    .filter((arcanum) => Number.isFinite(arcanum.rank) && !!arcanum.spellId);
}

/** Les rangs encore à choisir : ceux que le niveau ouvre et que la fiche ne porte pas. */
export function rangsArcanumAChoisir(sheet: CharacterSheet): number[] {
  const pris = arcanumChoisis(sheet).map((arcanum) => arcanum.rank);
  const restants = [...pris];
  return rangsArcanumDus(sheet).filter((rang) => {
    const index = restants.indexOf(rang);
    if (index >= 0) { restants.splice(index, 1); return false; }
    return true;
  });
}

/** Les sorts d'Occultiste de ce rang, hors ceux déjà pris en Arcanum. */
export function sortsArcanumPossibles(sheet: CharacterSheet, rang: number): Spell[] {
  const dejaPris = new Set(arcanumChoisis(sheet).map((arcanum) => arcanum.spellId));
  return spellsForClass('occultiste', rang).filter((spell) => !dejaPris.has(spell.id));
}

const avecArcanum = (sheet: CharacterSheet, arcanum: Arcanum[]): CharacterSheet => ({
  ...sheet,
  classChoices: {
    ...sheet.classChoices,
    occultiste: {
      ...choicesFor(sheet, 'occultiste'),
      [CLE_ARCANUM]: arcanum.map((entree) => `${entree.rank}:${entree.spellId}`),
    },
  },
});

export function ajouterArcanum(sheet: CharacterSheet, rang: number, spellId: string): CharacterSheet {
  const spell = spellById(spellId);
  if (!spell || spell.level !== rang) return sheet;
  return avecArcanum(sheet, [...arcanumChoisis(sheet), { rank: rang, spellId }]);
}

/**
 * Le remplacement offert à chaque niveau : un Arcanum contre un autre sort
 * d'Occultiste DU MÊME RANG. Un Arcanum de rang 6 ne devient jamais un rang 7.
 */
export function remplacerArcanum(sheet: CharacterSheet, ancien: string, nouveau: string): CharacterSheet {
  const actuels = arcanumChoisis(sheet);
  const cible = actuels.find((arcanum) => arcanum.spellId === ancien);
  if (!cible) return sheet;
  if (actuels.some((arcanum) => arcanum.spellId === nouveau)) return sheet;
  const spell = spellById(nouveau);
  if (!spell || spell.level !== cible.rank) return sheet;
  return avecArcanum(sheet, actuels.map((arcanum) => (
    arcanum.spellId === ancien ? { rank: arcanum.rank, spellId: nouveau } : arcanum
  )));
}

/** Un lancement gratuit par Arcanum, rendu au repos long. */
export const arcanumResourceKey = (rang: number): string => `occultiste:arcanum-${rang}`;
