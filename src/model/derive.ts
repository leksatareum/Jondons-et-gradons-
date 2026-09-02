import {
  abilityModifier, choiceList, choicesFor, effectiveAbilities, levelInClass,
  subclassOf, totalLevel,
  type AbilityScores, type CharacterSheet,
} from './character';
import { proficiencyBonus } from '../domain/proficiency';
import { armorClassBonusFor, chosenFightingStyles } from '../domain/fighting-styles';
import {
  cantripsKnown, fullCasterSlots, halfCasterSlots, pactMagicSlots,
  tabledPreparedSpellCount, wizardSpellbookSize,
} from '../domain/spellcasting-progression';
import { alwaysPreparedSpellsFor } from '../content/always-prepared-spells';
import { classFeaturesUpTo } from '../content/class-features';
import { subclassFeaturesUpTo } from '../content/subclasses';
import { classById } from '../content/classes';
import { spellcastingAbility, spellcastingNumbers, type SpellcastingNumbers } from '../domain/spellcasting';
import { spellById } from '../content/spell-catalogue';
import { grantResourceKey } from './spell-grants';
import { arcanumChoisis, arcanumResourceKey } from './invocations';
import { competenceExplorateurAgile, sortMineurSupplementaireDuDruide } from './choix-de-classe';
import { formatMeters, parseMeters } from '../domain/meters';
import { backgroundById } from '../content/backgrounds';
import { SKILLS } from '../content/character-basics';
import { armorById } from '../content/armor';
import { bonusBouclier } from '../domain/armor-ownership';
import { speciesById, speciesMagicFor, speciesResistancesFor } from '../content/species';
import { speciesResourcesFor } from '../domain/species-resources';
import { classResourcesFor } from '../content/class-resources';
import { wildShapeUses } from '../domain/druid-resources';
import { hunterMarkFreeCastUses, natureVeilUses } from '../domain/ranger-resources';
import { ruseMagiqueRecoverableSlots } from '../domain/warlock-resources';
import {
  archfeyFeyStepUses, celestialHealingLightDice,
  fiendDarkOnesLuckUses, greatOldOneClairvoyantCombatantUses, PAS_DES_FEES_KEY,
} from '../domain/warlock-patron-resources';

/**
 * Dérivation : tout ce que `table-connectee` figeait dans la fiche est
 * recalculé ici à chaque lecture, à partir des seules décisions du joueur.
 *
 * C'est le cœur de la promesse du projet : ajouter une règle demain, c'est
 * modifier ce fichier (ou une table de `content/`), et toutes les fiches
 * existantes en bénéficient au prochain affichage — sans migration, sans
 * qu'un personnage créé « trop tôt » soit privé de quoi que ce soit.
 */

export interface DerivedResource {
  key: string;
  name: string;
  max: number;
  spent: number;
  remaining: number;
  recharge: 'court' | 'long' | 'court_ou_long';
  /**
   * Utilisations rendues par un repos court quand ce n'est PAS toute la
   * réserve — la Forme sauvage en rend une, la Rage aussi, et plusieurs
   * capacités 2024 suivent la même règle. Sans ce champ il faudrait choisir
   * entre en rendre trop (`court`) et n'en rendre aucune (`long`) : deux
   * façons de fausser une partie.
   */
  shortRecovery?: number;
  sourceClass: string;
}

export interface DerivedSlot {
  level: number;
  max: number;
  spent: number;
  remaining: number;
  /** Vrai pour la réserve de Magie de pacte, comptée à part. */
  pact?: boolean;
}

export interface DerivedSpellcasting {
  /**
   * DD de sauvegarde et bonus d'attaque, par classe lanceuse. Un multiclassé
   * en a un jeu par classe : ils ne se combinent pas, contrairement aux
   * emplacements.
   */
  numbers: Record<string, SpellcastingNumbers>;
  /** Rang de sort le plus élevé accessible, hors pacte. */
  maxSpellLevel: number;
  slots: DerivedSlot[];
  cantripsKnown: Record<string, number>;
  /** Nombre de sorts préparables, par classe qui prépare. */
  preparedMax: Record<string, number>;
  /** Sorts accordés d'office : ils s'ajoutent au budget, ils ne le consomment pas. */
  alwaysPrepared: string[];
  spellbookSize?: number;
}

export interface DerivedSkill {
  id: string;
  name: string;
  ability: keyof AbilityScores;
  proficient: boolean;
  /** Maîtrise doublée — nécessite déjà `proficient`, jamais seule. */
  expertise: boolean;
  bonus: number;
}

export interface DerivedCharacter {
  level: number;
  proficiencyBonus: number;
  abilities: AbilityScores;
  modifiers: Record<keyof AbilityScores, number>;
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  armorClass: number;
  speed: string;
  darkvision: number;
  resistances: string[];
  saveProficiencies: string[];
  skillProficiencies: string[];
  /** Les 18 compétences du PHB, bonus final déjà calculé — rien à recalculer à l'écran. */
  skills: DerivedSkill[];
  /**
   * L'Épuisement, et ce qu'il coûte (PHB 2024, glossaire p. 365).
   *
   * Exposé plutôt que fondu dans `modifiers` : la pénalité frappe les TESTS
   * D20 — compétences, sauvegardes, initiative — et rien d'autre. La glisser
   * dans les modificateurs de caractéristique l'aurait aussi appliquée aux
   * dégâts et au DD des sorts, où elle n'a rien à faire.
   */
  exhaustion: {
    level: number;
    /** À soustraire de tout test d20 : deux fois le niveau. */
    d20Penalty: number;
    /** Vitesse perdue, en mètres : 1,50 m par cran. */
    speedPenaltyMeters: number;
    /** Le personnage meurt au sixième cran. */
    fatal: boolean;
  };
  features: { level: number; name: string; source: string; desc?: string }[];
  resources: DerivedResource[];
  spellcasting: DerivedSpellcasting;
  hitDice: { classId: string; die: number; total: number; spent: number; remaining: number }[];
}

/**
 * Contribution d'une classe au niveau de lanceur multiclassé, PHB 2024.
 *
 * L'ARRONDI SE FAIT PAR CLASSE, jamais sur la somme. Un lanceur complet
 * (Barde, Clerc, Druide, Ensorceleur, Magicien) apporte tous ses niveaux ;
 * un demi-lanceur (Paladin, Rôdeur) apporte la moitié ARRONDIE AU SUPÉRIEUR.
 *
 * Sommer les fractions puis arrondir une seule fois donne un niveau trop
 * bas — c'est ce que faisait ce module : Rôdeur 9 / Druide 4 valait
 * floor(4,5 + 4) = 8 au lieu de ceil(9/2) + 4 = 9.
 */
export const casterContribution = (caster: string | null | undefined, level: number): number => {
  if (caster === 'full') return level;
  if (caster === 'half') return Math.ceil(level / 2);
  // Un tiers arrondi à l'inférieur (Chevalier occulte, Escroc arcanique).
  if (caster === 'third') return Math.floor(level / 3);
  return 0;
};

/** Emplacements de sort combinés, règle de multiclassage. Le pacte est à part. */
const multiclassSlots = (sheet: CharacterSheet): number[] => {
  let casterLevel = 0;
  let hasCaster = false;
  for (const entry of sheet.classLevels) {
    const caster = classById(entry.classId)?.caster;
    if (!caster || caster === 'pact') continue;
    hasCaster = true;
    casterLevel += casterContribution(caster, entry.level);
  }
  if (!hasCaster) return [];
  return fullCasterSlots(Math.max(1, casterLevel));
};

const singleCasterSlots = (sheet: CharacterSheet): number[] | null => {
  const casters = sheet.classLevels.filter((entry) => {
    const caster = classById(entry.classId)?.caster;
    return caster === 'full' || caster === 'half';
  });
  if (casters.length !== 1) return null;
  const only = casters[0];
  const caster = classById(only.classId)?.caster;
  return caster === 'full' ? fullCasterSlots(only.level) : halfCasterSlots(only.level);
};

const derivedResources = (sheet: CharacterSheet, abilities: AbilityScores): DerivedResource[] => {
  const spent = sheet.live.resourcesSpent ?? {};
  const out: DerivedResource[] = [];
  const push = (
    key: string, name: string, max: number,
    recharge: DerivedResource['recharge'], sourceClass: string,
    shortRecovery?: number,
  ) => {
    if (max <= 0) return;
    const used = Math.max(0, spent[key] ?? 0);
    out.push({
      key, name, max, spent: Math.min(used, max), remaining: Math.max(0, max - used),
      recharge, shortRecovery, sourceClass,
    });
  };

  const druide = levelInClass(sheet, 'druide');
  // `shortRecovery: 1` — PHB 2024, Druide 2 : le repos court rend UNE
  // utilisation, le repos long toutes. Cette règle vivait dans un cas
  // particulier de `shortRest` ; elle est désormais dite ici, avec la réserve
  // qu'elle concerne, et partagée avec la Rage et le Second souffle.
  if (druide) push('druide:forme-sauvage', 'Forme sauvage', wildShapeUses(druide), 'long', 'druide', 1);

  // ── Cercles druidiques ────────────────────────────────────────────
  // Ces réserves existaient dans les tables du domaine sans jamais être
  // déclarées ici : aucune pastille, aucun repos ne les rendait.
  const cercle = subclassOf(sheet, 'druide');
  const sagesse = abilityModifier(abilities.wis);
  if (druide >= 10 && /cercle de la lune/i.test(cercle ?? '')) {
    push('druide:pas-clair-lune', 'Pas de clair de lune', Math.max(1, sagesse), 'long', 'druide');
  }
  // Récupération naturelle (Cercle de la Terre 6) : deux effets, deux
  // réserves, chacune une fois par repos long.
  if (druide >= 6 && /cercle de la terre/i.test(cercle ?? '')) {
    push('druide:sort-cercle-gratuit', 'Sort de cercle sans emplacement', 1, 'long', 'druide');
    push('druide:recuperation-naturelle', 'Récupération naturelle', 1, 'long', 'druide');
  }
  if (druide >= 3 && /cercle des étoiles|cercle des etoiles/i.test(cercle ?? '')) {
    push('druide:carte-etoiles', 'Trait guidé (carte des étoiles)', Math.max(1, sagesse), 'long', 'druide');
  }
  if (druide >= 6 && /cercle des étoiles|cercle des etoiles/i.test(cercle ?? '')) {
    push('druide:presage-cosmique', 'Présage cosmique', Math.max(1, sagesse), 'long', 'druide');
  }

  const rodeur = levelInClass(sheet, 'rodeur');
  if (rodeur) {
    push('rodeur:marque-chasseur', 'Marque du chasseur (sans emplacement)', hunterMarkFreeCastUses(rodeur), 'long', 'rodeur');
    push('rodeur:voile-nature', 'Voile de la nature', natureVeilUses(rodeur, abilityModifier(abilities.wis)), 'long', 'rodeur');
    // Infatigable (niveau 10) a DEUX effets : le cran d'épuisement rendu au
    // repos court, déjà appliqué, et une réserve de PV temporaires que rien
    // ne comptait — 1d8 + Sagesse, Sagesse fois par repos long (p. 121).
    if (rodeur >= 10) {
      push('rodeur:infatigable', 'Infatigable (PV temporaires)', Math.max(1, abilityModifier(abilities.wis)), 'long', 'rodeur');
    }
  }

  // ── Archétypes du Rôdeur ──────────────────────────────────────────
  const archetype = subclassOf(sheet, 'rodeur');
  const sagesseRodeur = Math.max(1, abilityModifier(abilities.wis));
  if (rodeur >= 3 && /traqueur des ténèbres|traqueur des tenebres/i.test(archetype ?? '')) {
    push('rodeur:frappe-redoutable', 'Frappe redoutable', sagesseRodeur, 'long', 'rodeur');
  }
  if (rodeur >= 11 && /vagabond féerique|vagabond feerique/i.test(archetype ?? '')) {
    push('rodeur:renforts-feeriques', 'Renforts féeriques (Invocation de fée)', 1, 'long', 'rodeur');
  }
  if (rodeur >= 15 && /vagabond féerique|vagabond feerique/i.test(archetype ?? '')) {
    push('rodeur:vagabond-brumeux', 'Vagabond brumeux (Pas brumeux)', sagesseRodeur, 'long', 'rodeur');
  }

  const occultiste = levelInClass(sheet, 'occultiste');
  if (occultiste >= 2) push('occultiste:ruse-magique', 'Ruse magique', 1, 'long', 'occultiste');

  // Arcanum mystique : chaque sort choisi se lance une fois sans emplacement,
  // et l'utilisation revient au repos long. Une réserve par rang, sans quoi
  // dépenser le rang 6 consommerait aussi le rang 7.
  for (const arcanum of arcanumChoisis(sheet)) {
    const sort = spellById(arcanum.spellId);
    push(
      arcanumResourceKey(arcanum.rank),
      `Arcanum de rang ${arcanum.rank}${sort ? ` — ${sort.name}` : ''}`,
      1, 'long', 'occultiste',
    );
  }

  // Contact du patron (niveau 9) : le sort est toujours préparé, et son
  // lancement gratuit — une fois par repos long — n'était compté nulle part.
  if (occultiste >= 9) push('occultiste:contact-patron', 'Contact du patron', 1, 'long', 'occultiste');

  const patron = subclassOf(sheet, 'occultiste');
  const cha = abilityModifier(abilities.cha);
  if (patron === 'Patron Céleste') push('occultiste:lumiere-guerisseuse', 'Lumière guérisseuse (dés)', celestialHealingLightDice(occultiste), 'long', 'occultiste');
  if (patron === 'Patron Fiélon') push('occultiste:chance-tenebreux', 'Chance du Ténébreux', fiendDarkOnesLuckUses(occultiste, cha), 'long', 'occultiste');
  if (patron === 'Patron Grand Ancien') push('occultiste:combattant-clairvoyant', 'Combattant clairvoyant', greatOldOneClairvoyantCombatantUses(occultiste), 'court', 'occultiste');
  if (patron === 'Patron Archifée') push(PAS_DES_FEES_KEY, 'Pas des fées', archfeyFeyStepUses(occultiste, cha), 'long', 'occultiste');

  // Trois réactions ou frappes limitées à une fois par repos long, dont deux
  // se rachètent avec un emplacement de pacte. Aucune n'était déclarée.
  if (patron === 'Patron Archifée' && occultiste >= 10) {
    push('occultiste:defenses-enjoleuses', 'Défenses enjôleuses', 1, 'long', 'occultiste');
  }
  if (patron === 'Patron Céleste' && occultiste >= 14) {
    push('occultiste:vengeance-brulante', 'Vengeance brûlante', 1, 'long', 'occultiste');
  }
  if (patron === 'Patron Fiélon' && occultiste >= 14) {
    push('occultiste:precipiter-enfers', 'Précipiter dans les Enfers', 1, 'long', 'occultiste');
  }

  // Les dons du MJ apportent leurs propres lancements. Ils viennent après les
  // ressources de classe et d'espèce parce qu'ils s'y ajoutent : un don ne
  // remplace jamais rien.
  for (const grant of sheet.grants ?? []) {
    const spell = spellById(grant.spellId);
    push(
      grantResourceKey(grant),
      `${spell?.name ?? grant.spellId} — ${grant.source}`,
      Math.max(0, grant.uses),
      grant.recharge,
      'don',
    );
  }

  for (const resource of speciesResourcesFor({
    speciesId: sheet.speciesId, lineageId: sheet.lineageId,
    speciesAncestry: sheet.ancestryId, level: totalLevel(sheet),
  })) {
    push(resource.resourceKey, resource.name, resource.max, resource.recharge, 'species');
  }

  /*
    Les réserves du tronc commun des NEUF autres classes, déclarées en données
    (`content/class-resources.ts`). En dernier, et sans recouvrement possible :
    ce fichier ne couvre ni le Druide, ni le Rôdeur, ni l'Occultiste, dont les
    réserves sont écrites à la main plus haut parce qu'elles dépendent de
    sous-classes et de dons.
  */
  for (const resource of classResourcesFor(sheet.classLevels, abilities)) {
    push(resource.key, resource.name, resource.max, resource.recharge, resource.classId, resource.shortRecovery);
  }
  return out;
};

export function deriveCharacter(sheet: CharacterSheet): DerivedCharacter {
  const level = totalLevel(sheet);
  const abilities = effectiveAbilities(sheet);
  const modifiers = Object.fromEntries(
    Object.entries(abilities).map(([key, score]) => [key, abilityModifier(score)]),
  ) as Record<keyof AbilityScores, number>;
  const prof = proficiencyBonus(level);
  const species = speciesById(sheet.speciesId);

  // ── Points de vie ──────────────────────────────────────────────────
  // Premier niveau de la classe principale : dé plein. Les suivants : le jet
  // enregistré s'il existe (c'est un fait historique, pas un calcul), sinon la
  // moyenne fixe du dé.
  const rolls = sheet.hitPointRolls ?? [];
  let maxHp = 0;
  let levelsCounted = 0;
  for (const entry of sheet.classLevels) {
    const die = classById(entry.classId)?.hitDie ?? 8;
    for (let i = 0; i < entry.level; i++) {
      if (levelsCounted === 0) maxHp += die;
      else maxHp += rolls[levelsCounted - 1] ?? Math.floor(die / 2) + 1;
      levelsCounted += 1;
    }
  }
  maxHp += level * (modifiers.con + (species?.hpPerLevel ?? 0));
  maxHp = Math.max(1, maxHp);
  // Un total imposé à l'import prime : voir `maxHpOverride` dans `character.ts`.
  if (typeof sheet.maxHpOverride === 'number') maxHp = Math.max(1, sheet.maxHpOverride);

  // ── Classe d'armure ────────────────────────────────────────────────
  const armor = armorById(sheet.armorId ?? 'none') ?? armorById('none')!;
  // Défense (style de combat) : +1 tant qu'une armure est portée — le
  // choix se sauvegardait sur la fiche sans jamais être relu nulle part.
  const styleDeCombat = chosenFightingStyles(sheet.classChoices);
  // `sheet.shield` n'est qu'une DÉCISION (équipé ou non, voir `model/weapons.ts`
  // `equiperBouclier`/`retirerBouclier`) — la possession, elle, se relit dans
  // le sac à chaque calcul, jamais figée au moment où le bouclier a été
  // équipé. Vendu, donné ou jamais eu, le bonus disparaît sans qu'il faille y
  // penser, exactement comme l'arme en main (`armeEnMain`).
  //
  // Le bonus est celui du MEILLEUR bouclier reconnu dans le sac, pas un +2
  // figé : « Bouclier », « Bouclier +1 », un exemplaire trouvé en jeu... tous
  // comptent, chacun avec le sien (`domain/armor-ownership.ts`).
  const armorClass = armor.base
    + (armor.dexCap === null ? modifiers.dex : Math.min(modifiers.dex, armor.dexCap))
    + (sheet.shield ? bonusBouclier(sheet.inventory) : 0)
    + armorClassBonusFor(styleDeCombat, armor.id !== 'none');

  // ── Maîtrises ──────────────────────────────────────────────────────
  const background = backgroundById(sheet.backgroundId);
  const saveProficiencies = [...new Set(
    sheet.classLevels.flatMap((entry, index) => (index === 0 ? classById(entry.classId)?.saves ?? [] : [])),
  )];
  const skillProficiencies = [...new Set([
    ...(background?.skills ?? []),
    ...sheet.skillProficiencies,
  ])];
  // L'Expertise double un bonus de maîtrise existant — elle ne le crée pas :
  // une compétence marquée en Expertise sans être elle-même maîtrisée reste
  // un simple modificateur de caractéristique, jamais deux fois le bonus.
  // ── Épuisement ─────────────────────────────────────────────────────
  // PHB 2024, glossaire p. 365 : « quand tu fais un test d20, le jet est
  // réduit de 2 fois ton niveau d'Épuisement ». L'application comptait les
  // crans et les rendait au repos, mais n'en appliquait jamais la pénalité :
  // un personnage à 3 d'Épuisement affichait les mêmes bonus qu'à 0.
  const exhaustion = Math.max(0, sheet.live.exhaustion ?? 0);
  const penaliteEpuisement = exhaustion * 2;

  // Explorateur agile (Rôdeur 2) choisit sa compétence d'expertise à part de
  // `sheet.expertise` — la décision existait sans écran pour la prendre, donc
  // sans jamais produire d'effet (voir `choix-de-classe.ts`).
  const explorateurAgile = competenceExplorateurAgile(sheet);
  const skills: DerivedSkill[] = SKILLS.map((skill) => {
    const proficient = skillProficiencies.includes(skill.id);
    const expertise = proficient && (sheet.expertise.includes(skill.id) || explorateurAgile === skill.id);
    const bonus = modifiers[skill.ability]
      + (expertise ? prof * 2 : proficient ? prof : 0)
      - penaliteEpuisement;
    return { id: skill.id, name: skill.name, ability: skill.ability, proficient, expertise, bonus };
  });

  // ── Capacités ──────────────────────────────────────────────────────
  const features = sheet.classLevels.flatMap((entry) => [
    ...classFeaturesUpTo(entry.classId, entry.level)
      .map((name) => ({ level: entry.level, name, source: entry.classId })),
    ...subclassFeaturesUpTo(entry.subclass, entry.level)
      .map((feature) => ({ level: feature.level, name: feature.name, source: entry.subclass ?? entry.classId, desc: feature.desc })),
  ]);

  // ── Magie ──────────────────────────────────────────────────────────
  const slotMaxes = singleCasterSlots(sheet) ?? multiclassSlots(sheet);
  const slotsSpent = sheet.live.spellSlotsSpent ?? {};
  const slots: DerivedSlot[] = slotMaxes.map((max, index) => {
    const slotLevel = index + 1;
    const spent = Math.max(0, slotsSpent[slotLevel] ?? 0);
    return { level: slotLevel, max, spent: Math.min(spent, max), remaining: Math.max(0, max - spent) };
  });

  const warlockLevel = levelInClass(sheet, 'occultiste');
  if (warlockLevel > 0) {
    const pact = pactMagicSlots(warlockLevel);
    const spent = Math.max(0, sheet.live.pactSlotsSpent ?? 0);
    slots.push({
      level: pact.slotLevel, max: pact.slots,
      spent: Math.min(spent, pact.slots), remaining: Math.max(0, pact.slots - spent), pact: true,
    });
  }

  const cantripCounts: Record<string, number> = {};
  const preparedMax: Record<string, number> = {};
  const numbers: Record<string, SpellcastingNumbers> = {};
  for (const entry of sheet.classLevels) {
    // Ordre primordial · Mage : un sort mineur de Druide en plus. C'est le
    // seul effet chiffré d'une décision de classe qui touche la magie ; le
    // laisser hors de la table rendait la décision purement décorative.
    const known = cantripsKnown(entry.classId as never, entry.level)
      + (entry.classId === 'druide' ? sortMineurSupplementaireDuDruide(sheet) : 0);
    if (known > 0) cantripCounts[entry.classId] = known;
    const klass = classById(entry.classId);
    if (!klass?.caster) continue;
    // Une seule règle pour les huit classes lanceuses : le nombre se lit dans
    // leur table de progression. La caractéristique d'incantation n'entre pas
    // dans ce calcul — elle sert au DD et au jet d'attaque.
    const preparables = tabledPreparedSpellCount(entry.classId as never, entry.level);
    if (preparables !== null) preparedMax[entry.classId] = preparables;

    const ability = spellcastingAbility(entry.classId);
    if (ability) {
      const chiffres = spellcastingNumbers(entry.classId, modifiers[ability], prof);
      if (chiffres) numbers[entry.classId] = chiffres;
    }
  }

  // Les sorts accordés viennent de la classe, de la sous-classe, du terrain —
  // et aussi de l'espèce ou du lignage (magie innée du Drow, du Tieffelin…),
  // que l'ancienne app marquait `source: 'species'` sur la fiche.
  const speciesMagic = speciesMagicFor(sheet.speciesId, sheet.lineageId, level);
  const alwaysPrepared = [...new Set([
    ...sheet.classLevels.flatMap((entry) => alwaysPreparedSpellsFor({
      classId: entry.classId,
      subclass: entry.subclass,
      terrain: choiceList(choicesFor(sheet, entry.classId), 'terrain')[0] ?? null,
      level: entry.level,
    })),
    ...speciesMagic.spells,
  ])];

  const wizardLevel = levelInClass(sheet, 'magicien');

  // ── Dés de vie ─────────────────────────────────────────────────────
  const hitDice = sheet.classLevels.map((entry) => {
    const die = classById(entry.classId)?.hitDie ?? 8;
    const spent = Math.max(0, sheet.live.hitDiceSpent?.[entry.classId] ?? 0);
    return { classId: entry.classId, die, total: entry.level, spent: Math.min(spent, entry.level), remaining: Math.max(0, entry.level - spent) };
  });

  return {
    level,
    proficiencyBonus: prof,
    abilities,
    modifiers,
    skills,
    maxHp,
    currentHp: Math.max(0, maxHp - Math.max(0, sheet.live.damageTaken ?? 0)),
    temporaryHp: Math.max(0, sheet.live.temporaryHp ?? 0),
    armorClass,
    speed: species?.speed ?? '9 m',
    darkvision: species?.lineages?.find((lineage) => lineage.id === sheet.lineageId)?.darkvision ?? species?.darkvision ?? 0,
    resistances: speciesResistancesFor(sheet.speciesId, sheet.lineageId, sheet.ancestryId),
    saveProficiencies,
    skillProficiencies,
    exhaustion: {
      level: exhaustion,
      d20Penalty: penaliteEpuisement,
      speedPenaltyMeters: exhaustion * 1.5,
      fatal: exhaustion >= 6,
    },
    features,
    resources: derivedResources(sheet, abilities),
    spellcasting: {
      numbers,
      maxSpellLevel: slotMaxes.length,
      slots,
      cantripsKnown: cantripCounts,
      preparedMax,
      alwaysPrepared,
      ...(wizardLevel > 0 ? { spellbookSize: wizardSpellbookSize(wizardLevel) } : {}),
    },
    hitDice,
  };
}

/**
 * La vitesse RÉELLEMENT disponible — `derived.speed` moins la pénalité
 * d'Épuisement, jamais sous 0. `derived.speed` reste la vitesse de l'espèce,
 * intacte : c'est ce nombre-ci, jamais l'autre, qu'il faut lire sur la
 * fiche — `speedPenaltyMeters` existait déjà (PHB 2024, table de
 * l'Épuisement) sans qu'aucun écran ne vienne jamais le soustraire.
 */
export function vitesseEffective(derived: DerivedCharacter): string {
  const base = parseMeters(derived.speed);
  if (base == null) return derived.speed;
  const effective = Math.max(0, base - derived.exhaustion.speedPenaltyMeters);
  return `${formatMeters(effective)} m`;
}
