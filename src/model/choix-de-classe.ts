import { choiceList, choicesFor, levelInClass, subclassOf, type CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';
import { ELEMENTAL_FURY, PRIMAL_ORDER, type ChoiceOption } from '../content/class-choices';
import { HUNTER_DEFENSE, HUNTER_PREY } from '../content/ranger-hunter-options';
import { DAMAGE_TYPES } from '../content/reference-lists';
import { alwaysPreparedSpellsFor, DRUID_TERRAINS } from '../content/always-prepared-spells';
import { cantripsKnown } from '../domain/spellcasting-progression';
import { backgroundById } from '../content/backgrounds';
import { SKILLS } from '../content/character-basics';
import { ownedWeapons } from '../domain/weapon-ownership';
import { isWeaponEligibleForMastery, weaponMasteryCount, type MasteryClassId } from '../domain/weapon-mastery';
import { WEAPON_MASTERIES } from '../content/weapons';

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
   * Choix MULTIPLE : jusqu'à `max` options à la fois, plutôt qu'une seule.
   * La Maîtrise d'armes en est le seul cas — deux types d'armes ou plus,
   * choisis parmi ce qu'on possède. `choisi` reste `null` pour ces
   * décisions ; c'est `choisis` qui compte.
   */
  choisis?: string[];
  max?: number;
  /**
   * Quand la décision se rechoisit, si elle se rechoisit. Le terrain du
   * Cercle de la Terre se reprend à chaque repos long, les options du
   * Chasseur à chaque repos, court ou long. Ne pas le dire ferait croire à
   * une décision définitive.
   */
  rechoisissable?: 'repos' | 'repos-long';
  /**
   * Verrouillée : la décision est prise et ne se rechoisit pas.
   *
   * L'Ordre primordial se choisit au niveau 1 « for good » (PHB 2024, p. 80),
   * la Furie élémentaire au niveau 7. Les laisser basculer d'un appui, c'était
   * pouvoir passer Mage → Gardien après avoir appris le sort mineur que Mage
   * accorde : la fiche se retrouvait avec plus de sorts mineurs que son quota,
   * sans que rien ne le signale.
   *
   * Le MJ, lui, peut corriger — c'est déjà lui qui déclenche les montées de
   * niveau.
   */
  verrouillee?: boolean;
  /**
   * Ce que la décision fait sur CETTE fiche, une fois prise.
   *
   * Sans cette ligne, choisir Mage n'avait aucun effet visible : le sort
   * mineur supplémentaire s'ajoutait à un quota qu'il fallait aller lire dans
   * le Grimoire. On pouvait raisonnablement croire que rien ne s'était passé.
   */
  effet?: string;
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

/** Compétences maîtrisées, fond de personnage compris — même liste que `derive.ts`. */
const competencesMaitrisees = (sheet: CharacterSheet): string[] => [...new Set([
  ...(backgroundById(sheet.backgroundId)?.skills ?? []),
  ...sheet.skillProficiencies,
])];

/**
 * Ce que l'Ordre primordial donne, dit en clair.
 *
 * Pour le Mage, le sort mineur supplémentaire n'est visible qu'au Grimoire,
 * dans un quota. Quand ce quota est déjà rempli — c'est le cas d'un
 * personnage importé de l'ancienne application, qui avait déjà choisi son
 * sort — il ne se passe rien de visible du tout.
 */
function effetOrdrePrimordial(
  sheet: CharacterSheet,
  derived?: DerivedCharacter,
): string | undefined {
  const ordre = choisiPour(sheet, 'druide', 'primalOrder');
  if (ordre === 'gardien') return 'Armes de guerre et armures intermédiaires.';
  if (ordre !== 'mage') return undefined;
  const max = derived?.spellcasting.cantripsKnown.druide;
  if (max === undefined) return 'Un sort mineur de Druide supplémentaire.';
  const connus = sheet.cantrips.filter((cantrip) => cantrip.sourceClass === 'druide').length;
  const reste = max - connus;
  if (reste > 0) {
    return `Sorts mineurs ${connus}/${max} — il t’en reste ${reste} à choisir dans le Grimoire.`;
  }
  return `Sorts mineurs ${connus}/${max} — le sort supplémentaire est déjà choisi.`;
}

/**
 * Toutes les décisions dues au niveau actuel, prises ou non.
 *
 * Elles restent listées une fois prises : un joueur doit pouvoir relire ce
 * qu'il a choisi sans rouvrir la montée de niveau.
 */
export function decisionsDeClasse(
  sheet: CharacterSheet,
  derived?: DerivedCharacter,
): DecisionDeClasse[] {
  const decisions: DecisionDeClasse[] = [];
  const druide = levelInClass(sheet, 'druide');

  if (druide >= 1) {
    decisions.push({
      classId: 'druide', key: 'primalOrder',
      label: 'Ordre primordial',
      help: 'Choisi au niveau 1, pour de bon.',
      options: PRIMAL_ORDER,
      choisi: choisiPour(sheet, 'druide', 'primalOrder'),
      effet: effetOrdrePrimordial(sheet, derived),
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

  if (rodeur >= 2) {
    const maitrisees = competencesMaitrisees(sheet);
    decisions.push({
      classId: 'rodeur', key: 'deftExplorerSkill',
      label: 'Explorateur agile — expertise',
      help: 'Choisie au niveau 2, pour de bon. Une compétence où tu es déjà maîtrisé : son bonus de maîtrise double.',
      options: SKILLS.filter((skill) => maitrisees.includes(skill.id))
        .map((skill) => ({ id: skill.id, name: skill.name, desc: 'Le bonus de maîtrise y compte double.' })),
      choisi: choisiPour(sheet, 'rodeur', 'deftExplorerSkill'),
    });
  }

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

  // Charme d'outre-monde (Vagabond féerique 3) : une maîtrise de compétence
  // liée au Charisme, choisie au niveau 3, pour de bon — PHB 2024, p. 123.
  // `estVagabondFeerique(sheet)` existait, la décision non : rien ne
  // demandait jamais cette maîtrise, alors que la fiche avait un endroit
  // pour la recevoir (`skillProficiencies`, comme n'importe quelle autre).
  if (rodeur >= 3 && estVagabondFeerique(sheet)) {
    const competencesCha = SKILLS.filter((skill) => skill.ability === 'cha');
    decisions.push({
      classId: 'rodeur', key: 'otherworldlyGlamourSkill',
      label: 'Charme d\'outre-monde — maîtrise',
      help: 'Choisie au niveau 3, pour de bon. Une compétence liée au Charisme, où tu deviens maîtrisé.',
      options: competencesCha.map((skill) => ({
        id: skill.id, name: skill.name, desc: 'Tu deviens maîtrisé de cette compétence.',
      })),
      choisi: choisiPour(sheet, 'rodeur', 'otherworldlyGlamourSkill'),
    });
  }

  // ── Occultiste ────────────────────────────────────────────────────
  // Résilience fiélonne (niveau 10) : un type de dégâts choisi à la fin de
  // chaque repos, autre que la force. Le choix tient jusqu'au suivant.
  if (levelInClass(sheet, 'occultiste') >= 10 && /patron fiélon|patron fielon/i.test(subclassOf(sheet, 'occultiste') ?? '')) {
    decisions.push({
      classId: 'occultiste', key: 'fiendishResilience',
      label: 'Résilience fiélonne',
      help: 'Un type de dégâts, autre que la force. Rechoisissable à la fin de chaque repos.',
      options: DAMAGE_TYPES.filter((type) => type !== 'force').map((type) => ({
        id: type,
        name: type.charAt(0).toLocaleUpperCase('fr') + type.slice(1),
        desc: `Résistance aux dégâts ${type}.`,
      })),
      choisi: choisiPour(sheet, 'occultiste', 'fiendishResilience'),
      rechoisissable: 'repos',
    });
  }

  // ── Maîtrise d'armes (Barbare, Guerrier, Paladin, Rôdeur, Roublard) ──
  // PHB 2024, p. 120 pour le Rôdeur : deux types d'armes, rechoisis à la fin
  // de chaque repos long. `weaponMasteryCount` et `isWeaponEligibleForMastery`
  // existaient déjà, exacts et testés, sans qu'aucun écran ne les serve : la
  // maîtrise s'appliquait donc à TOUTE arme en main, jamais restreinte aux
  // armes réellement choisies.
  for (const classId of ['barbare', 'guerrier', 'paladin', 'rodeur', 'roublard'] as MasteryClassId[]) {
    const niveauClasse = levelInClass(sheet, classId);
    // `weaponMasteryCount` ne teste le niveau QUE pour les paliers de sa
    // propre classe (guerrier 4/10/16, barbare 4) : à niveau 0, hors de la
    // classe, elle rend quand même 2 ou 3 par construction. Sans ce garde,
    // un Rôdeur pur se voyait proposer la Maîtrise d'armes du Barbare, du
    // Guerrier, du Paladin ET du Roublard — chacun avec son propre filtre
    // d'armes éligibles, jamais le sien.
    if (niveauClasse < 1) continue;
    const nombre = weaponMasteryCount(classId, niveauClasse);
    if (nombre <= 0) continue;
    const possedees = ownedWeapons(sheet.inventory).filter((weapon) => isWeaponEligibleForMastery(classId, weapon));
    if (possedees.length === 0) continue;
    const choisisValides = choiceList(choicesFor(sheet, classId), 'weaponMasteries')
      .filter((id) => possedees.some((weapon) => weapon.id === id));
    decisions.push({
      classId, key: 'weaponMasteries',
      label: `Maîtrise d'armes (${nombre})`,
      help: `Choisis jusqu'à ${nombre} arme${nombre > 1 ? 's' : ''} parmi celles que tu possèdes — leur maîtrise ne s'applique qu'à elles. Se reverrouille au premier repos court ; se rouvre à chaque repos long.`,
      options: possedees.map((weapon) => ({
        id: weapon.id, name: weapon.name,
        desc: `${weapon.mastery} — ${WEAPON_MASTERIES[weapon.mastery]?.desc ?? ''}`,
      })),
      choisi: null,
      choisis: choisisValides,
      max: nombre,
      rechoisissable: 'repos-long',
    });
  }

  // Une décision qui ne se rechoisit pas et qui est prise est verrouillée.
  // La règle est la même pour toutes : c'est `rechoisissable` qui la porte,
  // pas une liste à tenir à jour ailleurs.
  //
  // La Maîtrise d'armes est à part : un choix MULTIPLE (`choisis`, jamais
  // `choisi`), donc la règle ci-dessus ne la verrouille jamais — et à raison,
  // ce n'est pas « prise pour de bon » qui la ferme, mais le repos long qui
  // vient de s'écouler (voir `rest.ts`, `weaponMasteriesLocked`).
  return decisions.map((decision) => {
    if (decision.key === 'weaponMasteries') {
      return sheet.live.weaponMasteriesLocked ? { ...decision, verrouillee: true } : decision;
    }
    return decision.choisi && !decision.rechoisissable ? { ...decision, verrouillee: true } : decision;
  });
}

/** Le Chasseur, quelle que soit la façon dont la fiche le nomme. */
export const estChasseur = (sheet: CharacterSheet): boolean => {
  const entree = sheet.classLevels.find((e) => e.classId === 'rodeur');
  if (entree?.subclassId === 'chasseur') return true;
  return /^chasseur$/i.test((subclassOf(sheet, 'rodeur') ?? '').trim());
};

/** Le Vagabond féerique, quelle que soit la façon dont la fiche le nomme. */
export const estVagabondFeerique = (sheet: CharacterSheet): boolean => {
  const entree = sheet.classLevels.find((e) => e.classId === 'rodeur');
  if (entree?.subclassId === 'feerique') return true;
  return /vagabond f[ée]erique/i.test((subclassOf(sheet, 'rodeur') ?? '').trim());
};

/** Décisions encore à prendre — celles qui manquent réellement à la fiche. */
export const decisionsEnAttente = (sheet: CharacterSheet): DecisionDeClasse[] =>
  decisionsDeClasse(sheet).filter((decision) => !decision.choisi);

/**
 * Enregistre un choix. Une option inconnue est refusée plutôt que stockée.
 *
 * Une décision verrouillée — prise et non rechoisissable — ne change plus,
 * sauf correction du MJ. Sans ce garde-fou, passer Mage → Gardien laissait la
 * fiche avec un sort mineur de trop, hors quota et sans avertissement.
 */
export function choisirDeClasse(
  sheet: CharacterSheet,
  classId: string,
  key: string,
  optionId: string,
  options: { parLeMj?: boolean } = {},
): CharacterSheet {
  const decision = decisionsDeClasse(sheet).find((d) => d.classId === classId && d.key === key);
  if (!decision) return sheet;
  if (!decision.options.some((option) => option.id === optionId)) return sheet;
  if (decision.verrouillee && !options.parLeMj) return sheet;

  // Choix multiple (Maîtrise d'armes…) : on bascule l'option plutôt que de
  // remplacer une valeur unique, plafonné à `max` sélections à la fois.
  if (decision.max && decision.max > 1) {
    const actuels = decision.choisis ?? [];
    const suivants = actuels.includes(optionId)
      ? actuels.filter((id) => id !== optionId)
      : actuels.length < decision.max ? [...actuels, optionId] : actuels;
    if (suivants === actuels) return sheet;
    return {
      ...sheet,
      classChoices: {
        ...sheet.classChoices,
        [classId]: { ...choicesFor(sheet, classId), [key]: suivants },
      },
    };
  }

  const suivante: CharacterSheet = {
    ...sheet,
    classChoices: {
      ...sheet.classChoices,
      [classId]: { ...choicesFor(sheet, classId), [key]: optionId },
    },
  };

  // Charme d'outre-monde (Vagabond féerique 3) : contrairement à
  // Explorateur agile (qui DOUBLE une maîtrise déjà là), cette décision en
  // ACCORDE une nouvelle — elle doit donc aussi rejoindre
  // `skillProficiencies`, la même liste que n'importe quel autre choix de
  // compétence. La classChoices seule ne changeait rien au calcul des
  // compétences.
  if (classId === 'rodeur' && key === 'otherworldlyGlamourSkill' && !suivante.skillProficiencies.includes(optionId)) {
    return { ...suivante, skillProficiencies: [...suivante.skillProficiencies, optionId] };
  }

  return suivante;
}

// ═══════════════════════════════════════════════════════════════════════
// Effets dérivés des décisions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Le sort mineur que l'Ordre primordial · Mage paie, quand on peut le nommer.
 *
 * Deux façons de le savoir, dans cet ordre :
 *
 * 1. Une fiche importée de l'ancienne application le nomme explicitement
 *    (`primalOrderCantrip`). Cette information existait et n'était plus lue
 *    par personne.
 * 2. Sinon, c'est le premier sort mineur appris AU-DELÀ de ce que la table de
 *    classe accorde. `cantrips` conserve l'ordre d'apprentissage : le sort à
 *    l'indice du quota de base est exactement celui que le bonus a permis de
 *    prendre. Attribution stable, et vraie.
 *
 * Rend `null` quand rien ne permet de trancher — un Druide Mage qui n'a pas
 * encore rempli son quota de base n'a pas de sort « en trop » à désigner.
 */
export function cantripDeLOrdrePrimordial(sheet: CharacterSheet): string | null {
  if (sortMineurSupplementaireDuDruide(sheet) === 0) return null;

  const mineursDeDruide = sheet.cantrips.filter((cantrip) => cantrip.sourceClass === 'druide');
  const nomme = choisiPour(sheet, 'druide', 'primalOrderCantrip');
  if (nomme && mineursDeDruide.some((cantrip) => cantrip.id === nomme)) return nomme;

  const base = cantripsKnown('druide', levelInClass(sheet, 'druide'));
  return mineursDeDruide[base]?.id ?? null;
}

/** Mage : un sort mineur de Druide supplémentaire (PHB 2024, Ordre primordial). */
export const sortMineurSupplementaireDuDruide = (sheet: CharacterSheet): number =>
  (levelInClass(sheet, 'druide') >= 1 && choisiPour(sheet, 'druide', 'primalOrder') === 'mage' ? 1 : 0);

/** Le terrain en cours, pour l'afficher là où les sorts de cercle apparaissent. */
export const terrainDuCercle = (sheet: CharacterSheet): string | null =>
  (estCercleDeLaTerre(sheet) ? choisiPour(sheet, 'druide', 'terrain') : null);

export const TERRAINS_CONNUS = DRUID_TERRAINS;

/**
 * La compétence choisie via Explorateur agile (Rôdeur 2) — expertise
 * permanente. `derive.ts` la lit pour doubler le bonus de maîtrise, au même
 * titre qu'une entrée de `sheet.expertise` : la décision existait déjà sans
 * jamais produire d'effet, faute d'écran pour la prendre.
 */
export const competenceExplorateurAgile = (sheet: CharacterSheet): string | null =>
  (levelInClass(sheet, 'rodeur') >= 2 ? choisiPour(sheet, 'rodeur', 'deftExplorerSkill') : null);

/**
 * Vrai si ce sort est un sort du terrain actuellement choisi.
 *
 * Récupération naturelle ne rend gratuit qu'un sort « de la capacité Sorts du
 * cercle » — pas n'importe quel sort accordé d'office. Un Druide de la Terre
 * a aussi Parler aux animaux toujours préparé, et celui-là ne compte pas.
 */
export function sortDuCercleDeLaTerre(sheet: CharacterSheet, spellId: string): boolean {
  const terrain = terrainDuCercle(sheet);
  if (!terrain) return false;
  return alwaysPreparedSpellsFor({
    terrain,
    level: levelInClass(sheet, 'druide'),
  }).includes(spellId);
}

/**
 * Les identifiants d'armes sur lesquelles la maîtrise s'applique VRAIMENT,
 * toutes classes confondues — au plus `weaponMasteryCount` par classe, et
 * seulement parmi celles choisies via la décision « Maîtrise d'armes ».
 *
 * `domain/weapon-attacks.ts` s'en sert pour n'afficher et n'appliquer la
 * maîtrise que sur les armes retenues : avant, une arme en main portait sa
 * maîtrise quelle que soit l'arme, choisie ou non.
 */
export function armesAvecMaitriseActive(sheet: CharacterSheet): ReadonlySet<string> {
  const actives = new Set<string>();
  for (const decision of decisionsDeClasse(sheet)) {
    if (decision.key !== 'weaponMasteries') continue;
    for (const id of decision.choisis ?? []) actives.add(id);
  }
  return actives;
}
