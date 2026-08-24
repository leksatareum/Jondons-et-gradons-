import { choiceList, choicesFor, levelInClass, subclassOf, type CharacterSheet } from './character';
import { ELEMENTAL_FURY, PRIMAL_ORDER, type ChoiceOption } from '../content/class-choices';
import { HUNTER_DEFENSE, HUNTER_PREY } from '../content/ranger-hunter-options';
import { DRUID_TERRAINS } from '../content/always-prepared-spells';

/**
 * Les décisions de classe qu'un personnage doit prendre — et que rien ne lui
 * demandait.
 *
 * `content/class-choices.ts` portait ces options depuis le début, complètes et
 * testées, et n'était importé par personne. Conséquence en partie : un Druide
 * du Cercle de la Terre n'avait aucun moyen de choisir son terrain, donc
 * aucun sort de cercle — la sous-classe entière ne faisait rien, alors que la
 * dérivation, elle, savait déjà les accorder (`derive.ts`, clé `terrain`).
 *
 * Une décision n'est pas une capacité : elle ne se dérive pas du niveau, elle
 * appartient au joueur. Ce module dit lesquelles sont dues, jamais laquelle
 * prendre.
 */

export interface DecisionDeClasse {
  classId: string;
  /** Clé dans `classChoices[classId]`, telle que la dérivation la lit. */
  key: string;
  label: string;
  /** Ce que la règle dit, en une phrase — pour choisir sans ouvrir le livre. */
  help: string;
  options: ChoiceOption[];
  choisi: string | null;
  /**
   * Quand la décision se rechoisit, si elle se rechoisit. Le terrain du
   * Cercle de la Terre se reprend à chaque repos long, les options du
   * Chasseur à chaque repos, court ou long. Ne pas le dire ferait croire à
   * une décision définitive.
   */
  rechoisissable?: 'repos' | 'repos-long';
}

const TERRAINS: ChoiceOption[] = [
  { id: 'aride', name: 'Aride', desc: 'Flou, Mains brûlantes, Trait de feu · 5 Boule de feu · 7 Flétrissement · 9 Mur de pierre. Résistance au feu (niveau 10).' },
  { id: 'polaire', name: 'Polaire', desc: 'Brouillard, Immobilisation de personne, Rayon de givre · 5 Tempête de neige · 7 Tempête de grêle · 9 Cône de froid. Résistance au froid (niveau 10).' },
  { id: 'temperee', name: 'Tempérée', desc: 'Pas brumeux, Toucher du choc, Sommeil · 5 Éclair · 7 Liberté de mouvement · 9 Foulée d’arbres. Résistance à la foudre (niveau 10).' },
  { id: 'tropicale', name: 'Tropicale', desc: 'Aspersion acide, Rayon de maladie, Toile d’araignée · 5 Nuage de poison · 7 Polymorphe · 9 Insectes. Résistance au poison (niveau 10).' },
];

/** Le Cercle de la Terre, quel que soit la façon dont la fiche le nomme. */
export const estCercleDeLaTerre = (sheet: CharacterSheet): boolean => {
  const entree = sheet.classLevels.find((e) => e.classId === 'druide');
  if (entree?.subclassId === 'terre') return true;
  return /cercle de la terre/i.test(subclassOf(sheet, 'druide') ?? '');
};

/** Les options du Chasseur ont leur propre type ; elles décrivent la même chose. */
const enOption = (option: { id: string; name: string; desc: string }): ChoiceOption => ({
  id: option.id, name: option.name, desc: option.desc,
});

const choisiPour = (sheet: CharacterSheet, classId: string, key: string): string | null =>
  choiceList(choicesFor(sheet, classId), key)[0] ?? null;

/**
 * Toutes les décisions dues au niveau actuel, prises ou non.
 *
 * Elles restent listées une fois prises : un joueur doit pouvoir relire ce
 * qu'il a choisi sans rouvrir la montée de niveau.
 */
export function decisionsDeClasse(sheet: CharacterSheet): DecisionDeClasse[] {
  const decisions: DecisionDeClasse[] = [];
  const druide = levelInClass(sheet, 'druide');

  if (druide >= 1) {
    decisions.push({
      classId: 'druide', key: 'primalOrder',
      label: 'Ordre primordial',
      help: 'Choisi au niveau 1, pour de bon.',
      options: PRIMAL_ORDER,
      choisi: choisiPour(sheet, 'druide', 'primalOrder'),
    });
  }

  if (druide >= 7) {
    decisions.push({
      classId: 'druide', key: 'elementalFury',
      label: 'Furie élémentaire',
      help: 'Choisie au niveau 7 ; elle grandit au niveau 15.',
      options: ELEMENTAL_FURY,
      choisi: choisiPour(sheet, 'druide', 'elementalFury'),
    });
  }

  if (druide >= 3 && estCercleDeLaTerre(sheet)) {
    decisions.push({
      classId: 'druide', key: 'terrain',
      label: 'Terrain du cercle',
      help: 'À la fin de chaque repos long, tu choisis un type de terrain ; tu as ses sorts préparés.',
      options: TERRAINS,
      choisi: choisiPour(sheet, 'druide', 'terrain'),
      rechoisissable: 'repos-long',
    });
  }

  // ── Rôdeur ────────────────────────────────────────────────────────
  const rodeur = levelInClass(sheet, 'rodeur');
  const chasseur = estChasseur(sheet);

  if (rodeur >= 3 && chasseur) {
    decisions.push({
      classId: 'rodeur', key: 'hunterPrey',
      label: 'Proie du chasseur',
      help: 'Rechoisissable à la fin de chaque repos, court ou long.',
      options: HUNTER_PREY.map(enOption),
      choisi: choisiPour(sheet, 'rodeur', 'hunterPrey'),
      rechoisissable: 'repos',
    });
  }

  if (rodeur >= 7 && chasseur) {
    decisions.push({
      classId: 'rodeur', key: 'hunterDefense',
      label: 'Tactique défensive',
      help: 'Rechoisissable à la fin de chaque repos, court ou long.',
      options: HUNTER_DEFENSE.map(enOption),
      choisi: choisiPour(sheet, 'rodeur', 'hunterDefense'),
      rechoisissable: 'repos',
    });
  }

  return decisions;
}

/** Le Chasseur, quelle que soit la façon dont la fiche le nomme. */
export const estChasseur = (sheet: CharacterSheet): boolean => {
  const entree = sheet.classLevels.find((e) => e.classId === 'rodeur');
  if (entree?.subclassId === 'chasseur') return true;
  return /^chasseur$/i.test((subclassOf(sheet, 'rodeur') ?? '').trim());
};

/** Décisions encore à prendre — celles qui manquent réellement à la fiche. */
export const decisionsEnAttente = (sheet: CharacterSheet): DecisionDeClasse[] =>
  decisionsDeClasse(sheet).filter((decision) => !decision.choisi);

/** Enregistre un choix. Une option inconnue est refusée plutôt que stockée. */
export function choisirDeClasse(
  sheet: CharacterSheet,
  classId: string,
  key: string,
  optionId: string,
): CharacterSheet {
  const decision = decisionsDeClasse(sheet).find((d) => d.classId === classId && d.key === key);
  if (!decision) return sheet;
  if (!decision.options.some((option) => option.id === optionId)) return sheet;
  return {
    ...sheet,
    classChoices: {
      ...sheet.classChoices,
      [classId]: { ...choicesFor(sheet, classId), [key]: optionId },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Effets dérivés des décisions
// ═══════════════════════════════════════════════════════════════════════

/** Mage : un sort mineur de Druide supplémentaire (PHB 2024, Ordre primordial). */
export const sortMineurSupplementaireDuDruide = (sheet: CharacterSheet): number =>
  (levelInClass(sheet, 'druide') >= 1 && choisiPour(sheet, 'druide', 'primalOrder') === 'mage' ? 1 : 0);

/** Le terrain en cours, pour l'afficher là où les sorts de cercle apparaissent. */
export const terrainDuCercle = (sheet: CharacterSheet): string | null =>
  (estCercleDeLaTerre(sheet) ? choisiPour(sheet, 'druide', 'terrain') : null);

export const TERRAINS_CONNUS = DRUID_TERRAINS;
