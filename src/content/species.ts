/**
 * Espèces jouables — PHB 2024 (dix espèces). Repêché de
 * `table-connectee/src/App.jsx` (`SPECIES`). Confiance haute : cohérent
 * avec la refonte 2024 des espèces (résistances liées à l'ascendance pour
 * le Drakéide, legs pour le Tieffelin, Forme imposante niveau 5 pour le
 * Goliath, don d'origine supplémentaire pour l'Humain…), mais pas confirmé
 * page à page contre le PHB papier — dix entrées, pas de raison de douter
 * du total, mais un détail isolé peut m'avoir échappé.
 */

export interface SpeciesLineage {
  id: string;
  name: string;
  speed?: string;
  darkvision?: number;
  spellcasting?: boolean;
  cantrips?: string[];
  /** [niveau minimum, id du sort] */
  spells?: [number, string][];
  resistance?: string;
  desc: string;
}

export interface SpeciesAncestry {
  id: string;
  name: string;
  damage?: string;
  desc?: string;
}

export interface SpeciesDef {
  id: string;
  name: string;
  speed: string;
  /** Portée de la vision dans le noir en mètres, 0 si aucune. */
  darkvision: number;
  sizes?: ('TP' | 'P' | 'M' | 'G')[];
  hpPerLevel?: number;
  resistances?: string[];
  cantrips?: string[];
  bonusSkill?: { label: string; from: string[] | 'any' };
  extraFeat?: boolean;
  lineages?: SpeciesLineage[];
  ancestries?: SpeciesAncestry[];
  desc: string;
}

export const SPECIES: SpeciesDef[] = [
  { id: 'aasimar', name: 'Aasimar', speed: '9 m', darkvision: 18, sizes: ['M', 'P'], resistances: ['nécrotiques', 'radiants'], cantrips: ['lumiere'], desc: 'Vision dans le noir, résistances nécrotique et radiante, Lumière, Mains guérisseuses et Révélation céleste dès le niveau 3.' },
  { id: 'drakeide', name: 'Drakéide', speed: '9 m', darkvision: 18, desc: "Souffle élémentaire selon l'ascendance draconique, résistance associée, vision dans le noir et vol draconique au niveau 5.", ancestries: [
    { id: 'noir', name: 'Dragon noir', damage: 'acide' }, { id: 'bleu', name: 'Dragon bleu', damage: 'foudre' },
    { id: 'airain', name: "Dragon d'airain", damage: 'feu' }, { id: 'bronze', name: 'Dragon de bronze', damage: 'foudre' },
    { id: 'cuivre', name: 'Dragon de cuivre', damage: 'acide' }, { id: 'or', name: "Dragon d'or", damage: 'feu' },
    { id: 'vert', name: 'Dragon vert', damage: 'poison' }, { id: 'rouge', name: 'Dragon rouge', damage: 'feu' },
    { id: 'argent', name: "Dragon d'argent", damage: 'froid' }, { id: 'blanc', name: 'Dragon blanc', damage: 'froid' },
  ] },
  { id: 'nain', name: 'Nain', speed: '9 m', darkvision: 36, hpPerLevel: 1, resistances: ['poison'], desc: 'Vision dans le noir à 36 m, résistance au poison, avantage contre Empoisonné, Robustesse naine et Connaissance de la pierre.' },
  { id: 'elfe', name: 'Elfe', speed: '9 m', darkvision: 18, bonusSkill: { label: 'Sens aiguisés', from: ['intuition', 'perception', 'survie'] }, desc: 'Vision dans le noir, Ascendance féerique, Transe (repos long en 4 heures).', lineages: [
    { id: 'drow', darkvision: 36, name: 'Drow', spellcasting: true, cantrips: ['lumieres-dansantes'], spells: [[3, 'lueurs-feeriques'], [5, 'tenebres']], desc: 'Vision dans le noir portée à 36 m, Lumières dansantes, puis Lueurs féeriques et Ténèbres.' },
    { id: 'hautelfe', name: 'Haut-elfe', spellcasting: true, cantrips: ['prestidigitation'], spells: [[3, 'detection-magie'], [5, 'pas-brumeux']], desc: 'Prestidigitation échangeable après un repos long, puis Détection de la magie et Pas brumeux.' },
    { id: 'boisel', speed: '10,5 m', name: 'Elfe des bois', spellcasting: true, cantrips: ['art-druidique'], spells: [[3, 'longstrider'], [5, 'passage-sans-trace']], desc: 'Vitesse portée à 10,5 m, Art druidique, puis Grands pas et Passage sans trace.' },
  ] },
  { id: 'gnome', name: 'Gnome', speed: '9 m', darkvision: 18, desc: 'Vision dans le noir, Ruse gnome (avantage aux sauvegardes INT, SAG et CHA contre la magie).', lineages: [
    { id: 'roches', name: 'Gnome des roches', spellcasting: true, cantrips: ['reparation', 'prestidigitation'], desc: 'Réparation, Prestidigitation et création de trois petits dispositifs activables.' },
    { id: 'forets', name: 'Gnome des forêts', spellcasting: true, cantrips: ['illusion-mineure'], spells: [[1, 'parler-animaux']], desc: 'Illusion mineure et Communication avec les animaux toujours préparée, lançable gratuitement un nombre de fois égal à la maîtrise.' },
  ] },
  { id: 'goliath', name: 'Goliath', speed: '10,5 m', darkvision: 0, desc: 'Ascendance de géant, Puissance corporelle et Forme imposante dès le niveau 5.', ancestries: [
    { id: 'nuage', name: 'Pérégrination des nuages', desc: 'Action bonus : téléportation de 9 m.' },
    { id: 'feu', name: 'Brûlure du feu', desc: '+1d10 dégâts de feu après une touche.' },
    { id: 'givre', name: 'Froid du givre', desc: '+1d6 froid et vitesse de la cible réduite de 3 m.' },
    { id: 'colline', name: 'Culbute des collines', desc: 'Une cible de taille G ou moins touchée est mise À terre.' },
    { id: 'pierre', name: 'Endurance de la pierre', desc: 'Réaction : réduit les dégâts de 1d12 + Constitution.' },
    { id: 'tempete', name: 'Tonnerre des tempêtes', desc: 'Réaction après des dégâts : 1d8 tonnerre à la source visible à 18 m.' },
  ] },
  { id: 'halfelin', name: 'Halfelin', speed: '9 m', darkvision: 0, desc: 'Brave (avantage aux sauvegardes pour éviter ou terminer l’état Effrayé), Chance (relance des 1 aux tests de d20), Agilité halfeline.' },
  { id: 'humain', name: 'Humain', speed: '9 m', darkvision: 0, sizes: ['M', 'P'], bonusSkill: { label: 'Compétent', from: 'any' }, extraFeat: true, desc: "Inspiration héroïque à chaque repos long, une compétence bonus, un don d'origine supplémentaire." },
  { id: 'orc', name: 'Orc', speed: '9 m', darkvision: 36, desc: "Vision dans le noir, Ténacité implacable (survivre à 1 PV), Ruée d'adrénaline." },
  { id: 'tieffelin', name: 'Tieffelin', speed: '9 m', darkvision: 18, sizes: ['M', 'P'], cantrips: ['thaumaturgie'], desc: 'Vision dans le noir, Thaumaturgie, résistance et magie innée selon le legs choisi.', lineages: [
    { id: 'abyssal', name: 'Legs abyssal', spellcasting: true, resistance: 'poison', cantrips: ['aspersion-poison'], spells: [[3, 'rayon-maladie'], [5, 'immobilisation-personne']], desc: 'Résistance au poison, Aspersion de poison, puis Rayon de maladie et Immobilisation de personne.' },
    { id: 'chtonien', name: 'Legs chthonien', spellcasting: true, resistance: 'nécrotiques', cantrips: ['contact-glacial'], spells: [[3, 'simulacre-vie'], [5, 'rayon-affaiblissement']], desc: 'Résistance nécrotique, Contact glacial, puis Simulacre de vie et Rayon d’affaiblissement.' },
    { id: 'infernal', name: 'Legs infernal', spellcasting: true, resistance: 'feu', cantrips: ['trait-feu'], spells: [[3, 'represailles-infernales'], [5, 'tenebres']], desc: 'Résistance au feu, Trait de feu, puis Représailles infernales et Ténèbres.' },
  ] },
];

export const speciesById = (id: string | null | undefined): SpeciesDef | undefined =>
  SPECIES.find((species) => species.id === id);

export const lineageOf = (speciesId: string | null | undefined, lineageId: string | null | undefined): SpeciesLineage | undefined =>
  speciesById(speciesId)?.lineages?.find((lineage) => lineage.id === lineageId);

/** Nom lisible d'une taille — les mêmes lettres que le bestiaire (`content/creatures.ts`). */
export const SIZE_LABEL: Record<'TP' | 'P' | 'M' | 'G', string> = {
  TP: 'Très petite', P: 'Petite', M: 'Moyenne', G: 'Grande',
};

/**
 * Les tailles qu'une espèce propose vraiment. La plupart n'en proposent
 * qu'une (Moyenne, implicite) — seules celles qui offrent un choix RÉEL
 * (PHB 2024 : Aasimar, Élfe, Humain, Tieffelin… « M ou P ») listent `sizes`.
 * Sans cette distinction, une espèce à taille fixe se serait vu proposer un
 * choix qui n'en est pas un.
 */
export const sizesFor = (speciesId: string | null | undefined): ('TP' | 'P' | 'M' | 'G')[] =>
  speciesById(speciesId)?.sizes ?? ['M'];

/**
 * La taille à afficher : celle choisie si elle est encore une option
 * valable pour cette espèce, sinon la première proposée. Une fiche jamais
 * remplie (le champ n'existait nulle part à l'écran jusqu'ici) affiche donc
 * quand même quelque chose de juste, plutôt qu'un blanc.
 */
export function resolvedSize(
  sheet: { speciesId: string | null | undefined; size?: string | null },
): 'TP' | 'P' | 'M' | 'G' {
  const options = sizesFor(sheet.speciesId);
  const choisie = sheet.size as 'TP' | 'P' | 'M' | 'G' | null | undefined;
  return choisie && options.includes(choisie) ? choisie : options[0];
}

export const ancestryOf = (speciesId: string | null | undefined, ancestryId: string | null | undefined): SpeciesAncestry | undefined =>
  speciesById(speciesId)?.ancestries?.find((ancestry) => ancestry.id === ancestryId);

/** Sorts mineurs et sorts innés accordés par l'espèce/le lignage, au niveau donné. */
export const speciesMagicFor = (
  speciesId: string | null | undefined,
  lineageId: string | null | undefined,
  level: number,
): { cantrips: string[]; spells: string[] } => {
  const species = speciesById(speciesId);
  const lineage = lineageOf(speciesId, lineageId);
  const cantrips = [...new Set([...(species?.cantrips ?? []), ...(lineage?.cantrips ?? [])])];
  const spells = (lineage?.spells ?? []).filter(([from]) => level >= from).map(([, id]) => id);
  return { cantrips, spells };
};

/** Résistances accordées par l'espèce, le lignage ou l'ascendance choisis. */
export const speciesResistancesFor = (
  speciesId: string | null | undefined,
  lineageId: string | null | undefined,
  ancestryId: string | null | undefined,
): string[] => {
  const species = speciesById(speciesId);
  const lineage = lineageOf(speciesId, lineageId);
  const ancestry = ancestryOf(speciesId, ancestryId);
  return [...new Set([...(species?.resistances ?? []), lineage?.resistance, ancestry?.damage].filter((value): value is string => Boolean(value)))];
};
