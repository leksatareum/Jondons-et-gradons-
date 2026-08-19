export const ABILITY_IDS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type AbilityId = (typeof ABILITY_IDS)[number];
export type FeatCategory = 'general' | 'epic';

export interface FeatPrerequisite {
  minLevel: number;
  ability13?: AbilityId[];
  spellcasting?: boolean;
  armorTraining?: 'Légère' | 'Intermédiaire' | 'Lourde';
  shieldTraining?: boolean;
}

export interface FeatDefinition {
  id: string;
  name: string;
  category: FeatCategory;
  prerequisite: FeatPrerequisite;
  abilityOptions: AbilityId[];
  abilityMaximum: 20 | 30;
  summary: string;
  repeatable?: boolean;
  hitPointMaximumBonus?: number;
  choiceHint?: string;
}

export interface FeatEligibilityContext {
  level: number;
  abilities: Record<AbilityId, number>;
  spellcasting: boolean;
  armorTraining: string[];
  shieldTraining: boolean;
  saveProficiencies?: AbilityId[];
  existingFeatIds?: string[];
}

const general = (
  id: string,
  name: string,
  abilityOptions: AbilityId[],
  summary: string,
  prerequisite: Omit<FeatPrerequisite, 'minLevel'> = {},
  extra: Partial<FeatDefinition> = {},
): FeatDefinition => ({
  id: `general-${id}`,
  name,
  category: 'general',
  prerequisite: { minLevel: 4, ...prerequisite },
  abilityOptions,
  abilityMaximum: 20,
  summary,
  ...extra,
});

const epic = (
  id: string,
  name: string,
  summary: string,
  abilityOptions: AbilityId[] = [...ABILITY_IDS],
  prerequisite: Omit<FeatPrerequisite, 'minLevel'> = {},
  extra: Partial<FeatDefinition> = {},
): FeatDefinition => ({
  id: `epic-${id}`,
  name,
  category: 'epic',
  prerequisite: { minLevel: 19, ...prerequisite },
  abilityOptions,
  abilityMaximum: 30,
  summary,
  ...extra,
});

/**
 * Les 42 dons généraux du Manuel des joueurs 2024. « Amélioration de
 * caractéristiques » est gérée séparément par le parcours de niveau, car elle
 * répartit deux points au lieu d'ajouter une capacité à la fiche.
 */
export const GENERAL_FEATS: FeatDefinition[] = [
  general('actor', 'Acteur', ['cha'], "+1 CHA. Avantage pour imiter une personne lorsque tu es déguisé et mimétisme de voix après l'avoir entendue.", { ability13: ['cha'] }),
  general('athlete', 'Athlète', ['str', 'dex'], '+1 FOR ou DEX. Vitesse d’escalade, redressement plus rapide et saut avec seulement 1,50 m d’élan.', { ability13: ['str', 'dex'] }),
  general('charger', 'Chargeur', ['str', 'dex'], '+1 FOR ou DEX. Après une course d’au moins 3 m en ligne droite, renforce une attaque ou repousse sa cible.', { ability13: ['str', 'dex'] }),
  general('chef', 'Chef', ['con', 'wis'], '+1 CON ou SAG. Maîtrise des ustensiles de cuisinier, repas de repos court et friandises qui accordent des PV temporaires.'),
  general('crossbow-expert', 'Expert des arbalètes', ['dex'], '+1 DEX. Ignore Chargement, permet le tir au contact et ajoute le modificateur aux dégâts de l’attaque supplémentaire à l’arbalète de poing.', { ability13: ['dex'] }),
  general('crusher', 'Broyeur', ['str', 'con'], '+1 FOR ou CON. Une frappe contondante peut déplacer la cible ; un critique contondant aide ensuite les attaques contre elle.'),
  general('defensive-duelist', 'Duelliste défensif', ['dex'], '+1 DEX. Réaction avec une arme de finesse pour ajouter le bonus de maîtrise à la CA contre des attaques de mêlée.', { ability13: ['dex'] }),
  general('dual-wielder', 'Combattant à deux armes', ['str', 'dex'], '+1 FOR ou DEX. Améliore le combat à deux armes, permet de dégainer ou rengainer deux armes et autorise deux armes non légères sous conditions.', { ability13: ['str', 'dex'] }),
  general('durable', 'Durable', ['con'], '+1 CON. Avantage aux jets de sauvegarde contre la mort et possibilité de dépenser un dé de vie pour se soigner par une action bonus.'),
  general('elemental-adept', 'Adepte élémentaire', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Choisis acide, froid, feu, foudre ou tonnerre : tes sorts ignorent la résistance et traitent les 1 de dégâts comme des 2.', { spellcasting: true }, { repeatable: true, choiceHint: 'Choisir un type de dégâts pour chaque acquisition.' }),
  general('fey-touched', 'Touché par les fées', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Pas brumeux et un sort de divination ou d’enchantement de niveau 1, chacun lançable gratuitement une fois par repos long.', {}, { choiceHint: 'Choisir aussi le sort de niveau 1 et sa caractéristique d’incantation.' }),
  general('grappler', 'Lutteur', ['str', 'dex'], '+1 FOR ou DEX. Une attaque à mains nues peut aussi agripper, tes attaques ont l’avantage contre tes cibles agrippées et tu les déplaces sans surcoût.', { ability13: ['str', 'dex'] }),
  general('great-weapon-master', 'Maître des armes lourdes', ['str'], '+1 FOR. Ajoute le bonus de maîtrise aux dégâts d’une attaque d’arme lourde pendant l’action Attaquer et offre une attaque bonus après critique ou mise à 0 PV.', { ability13: ['str'] }),
  general('heavily-armored', 'Armure lourde', ['con', 'str'], '+1 CON ou FOR et entraînement aux armures lourdes.', { armorTraining: 'Intermédiaire' }),
  general('heavy-armor-master', 'Maître des armures lourdes', ['con', 'str'], '+1 CON ou FOR. En armure lourde, réduit les dégâts contondants, perforants et tranchants des attaques de ton bonus de maîtrise.', { armorTraining: 'Lourde' }),
  general('inspiring-leader', 'Chef inspirant', ['wis', 'cha'], '+1 SAG ou CHA. À la fin d’un repos, jusqu’à six alliés gagnent des PV temporaires selon ton niveau et la caractéristique choisie.', { ability13: ['wis', 'cha'] }),
  general('keen-mind', 'Esprit affûté', ['int'], '+1 INT. Maîtrise ou expertise dans une compétence de savoir et action Étudier en action bonus.', { ability13: ['int'] }, { choiceHint: 'Choisir Arcanes, Histoire, Investigation, Nature ou Religion.' }),
  general('lightly-armored', 'Armure légère', ['str', 'dex'], '+1 FOR ou DEX et entraînement aux armures légères et aux boucliers.'),
  general('mage-slayer', 'Tueur de mages', ['str', 'dex'], '+1 FOR ou DEX. Désavantage aux sauvegardes de concentration provoquées par tes dégâts et réussite automatique possible à une sauvegarde mentale par repos court ou long.'),
  general('martial-weapon-training', 'Entraînement aux armes de guerre', ['str', 'dex'], '+1 FOR ou DEX et maîtrise des armes de guerre.'),
  general('medium-armor-master', 'Maître des armures intermédiaires', ['str', 'dex'], '+1 FOR ou DEX. En armure intermédiaire, plafond de DEX à +3 et pas de désavantage de Discrétion.', { armorTraining: 'Intermédiaire' }),
  general('moderately-armored', 'Armure intermédiaire', ['str', 'dex'], '+1 FOR ou DEX et entraînement aux armures intermédiaires.', { armorTraining: 'Légère' }),
  general('mounted-combatant', 'Combattant monté', ['str', 'dex', 'wis'], '+1 FOR, DEX ou SAG. Avantage contre de plus petites cibles, redirection des attaques et meilleure protection de la monture.'),
  general('observant', 'Observateur', ['int', 'wis'], '+1 INT ou SAG. Maîtrise ou expertise en Intuition, Investigation ou Perception et action Chercher en action bonus.', { ability13: ['int', 'wis'] }),
  general('piercer', 'Perceur', ['str', 'dex'], '+1 FOR ou DEX. Relance un dé de dégâts perforants par tour et ajoute un dé sur un critique perforant.'),
  general('poisoner', 'Empoisonneur', ['dex', 'int'], '+1 DEX ou INT. Ignore la résistance au poison, maîtrise le nécessaire d’empoisonneur et fabrique rapidement des doses de poison.'),
  general('polearm-master', 'Maître des armes d’hast', ['str', 'dex'], '+1 FOR ou DEX. Attaque bonus avec certaines armes d’hast et attaque d’opportunité lorsqu’un ennemi entre dans leur allonge.', { ability13: ['str', 'dex'] }),
  general('resilient', 'Résilient', [...ABILITY_IDS], '+1 dans une caractéristique dont tu ne maîtrises pas les sauvegardes, puis maîtrise de ces sauvegardes.', {}, { choiceHint: 'La caractéristique choisie doit être une sauvegarde non maîtrisée.' }),
  general('ritual-caster', 'Incantateur rituel', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Deux rituels de niveau 1 toujours préparés et un rituel préparé peut être lancé avec son temps normal une fois par repos long.', { ability13: ['int', 'wis', 'cha'] }, { choiceHint: 'Choisir deux sorts de niveau 1 portant l’étiquette Rituel.' }),
  general('sentinel', 'Sentinelle', ['str', 'dex'], '+1 FOR ou DEX. Réaction contre un ennemi qui frappe un allié proche, avantage aux attaques d’opportunité et vitesse de la cible ramenée à 0 sur un coup.', { ability13: ['str', 'dex'] }),
  general('shadow-touched', 'Touché par les ombres', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Invisibilité et un sort d’illusion ou de nécromancie de niveau 1, chacun lançable gratuitement une fois par repos long.', {}, { choiceHint: 'Choisir aussi le sort de niveau 1 et sa caractéristique d’incantation.' }),
  general('sharpshooter', 'Tireur d’élite', ['dex'], '+1 DEX. Ignore les abris partiels, le désavantage à longue portée et au contact, et permet des tirs de précision supplémentaires.', { ability13: ['dex'] }),
  general('shield-master', 'Maître du bouclier', ['str'], '+1 FOR. Coup de bouclier après une attaque réussie et meilleure défense de Dextérité tant que le bouclier est équipé.', { shieldTraining: true }),
  general('skill-expert', 'Expert en compétences', [...ABILITY_IDS], '+1 dans une caractéristique, maîtrise d’une compétence et expertise dans une compétence maîtrisée.', {}, { choiceHint: 'Choisir une nouvelle maîtrise et une expertise.' }),
  general('skulker', 'Furtif', ['dex'], '+1 DEX. Perception aveugle à 3 m, aide à rester caché après une attaque ratée et annule le désavantage de Perception en lumière faible.', { ability13: ['dex'] }),
  general('slasher', 'Trancheur', ['str', 'dex'], '+1 FOR ou DEX. Réduit la vitesse après des dégâts tranchants et un critique impose le désavantage aux attaques de la cible.'),
  general('speedy', 'Rapide', ['dex', 'con'], '+1 DEX ou CON. Vitesse +3 m, terrain difficile ignoré pendant une Ruée et désavantage aux attaques d’opportunité contre toi.', { ability13: ['dex', 'con'] }),
  general('spell-sniper', 'Tireur de sorts', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Les attaques de sort ignorent les abris, ne subissent pas le désavantage au contact et gagnent 18 m de portée.', { spellcasting: true }),
  general('telekinetic', 'Télékinésiste', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Main de mage améliorée et poussée télékinétique de 1,50 m en action bonus.'),
  general('telepathic', 'Télépathe', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Communication télépathique à 18 m et Détection des pensées gratuit une fois par repos long.'),
  general('war-caster', 'Mage de guerre', ['int', 'wis', 'cha'], '+1 INT, SAG ou CHA. Avantage aux sauvegardes de concentration, sort en réaction à la place d’une attaque d’opportunité et composantes somatiques mains occupées.', { spellcasting: true }),
  general('weapon-master', 'Maître d’armes', ['str', 'dex'], '+1 FOR ou DEX. Maîtrise d’une propriété d’un type d’arme maîtrisé, échangeable après chaque repos long.', {}, { choiceHint: 'Choisir un type d’arme maîtrisé.' }),
];

export const EPIC_BOONS: FeatDefinition[] = [
  epic('combat-prowess', 'Faveur de prouesse au combat', '+1 à une caractéristique, maximum 30. Une attaque ratée peut toucher à la place, une fois par tour.'),
  epic('dimensional-travel', 'Faveur du voyage dimensionnel', '+1 à une caractéristique, maximum 30. Téléportation de 9 m après une action Attaquer ou Magie.'),
  epic('energy-resistance', 'Faveur de résistance énergétique', '+1 à une caractéristique, maximum 30. Deux résistances énergétiques modulables après repos long et redirection d’énergie en réaction.', [...ABILITY_IDS], {}, { choiceHint: 'Choisir deux types parmi acide, froid, feu, foudre, nécrotique, poison, psychique, radiant et tonnerre.' }),
  epic('fate', 'Faveur du destin', '+1 à une caractéristique, maximum 30. Ajoute ou retranche 2d4 à un test de d20 proche, rechargé par initiative ou repos.'),
  epic('fortitude', 'Faveur de robustesse', '+1 à une caractéristique, maximum 30. Maximum de PV +40 et supplément de soin égal au modificateur de Constitution une fois par tour.', [...ABILITY_IDS], {}, { hitPointMaximumBonus: 40 }),
  epic('irresistible-offense', 'Faveur d’offense irrésistible', '+1 FOR ou DEX, maximum 30. Les dégâts physiques ignorent la résistance et un 20 naturel ajoute la valeur de la caractéristique choisie.', ['str', 'dex']),
  epic('recovery', 'Faveur de récupération', '+1 à une caractéristique, maximum 30. Survie et soin massif une fois par repos long, plus une réserve de dix d10 de récupération.'),
  epic('skill', 'Faveur de compétence', '+1 à une caractéristique, maximum 30. Maîtrise de toutes les compétences et une expertise supplémentaire.', [...ABILITY_IDS], {}, { choiceHint: 'Choisir une compétence sans expertise.' }),
  epic('speed', 'Faveur de rapidité', '+1 à une caractéristique, maximum 30. Vitesse +9 m et Désengagement en action bonus qui met aussi fin à Agrippé.'),
  epic('spell-recall', 'Faveur de rappel de sort', '+1 INT, SAG ou CHA, maximum 30. Un emplacement de niveau 1 à 4 peut ne pas être dépensé sur le résultat correspondant d’un d4.', ['int', 'wis', 'cha'], { spellcasting: true }),
  epic('night-spirit', 'Faveur de l’esprit nocturne', '+1 à une caractéristique, maximum 30. Invisibilité brève et résistance à presque tous les dégâts dans la lumière faible ou les ténèbres.'),
  epic('truesight', 'Faveur de vision lucide', '+1 à une caractéristique, maximum 30. Vision lucide à 18 m.'),
];

export const ALL_LEVEL_FEATS = [...GENERAL_FEATS, ...EPIC_BOONS];

export function featById(id: string | null | undefined): FeatDefinition | undefined {
  return ALL_LEVEL_FEATS.find((feat) => feat.id === id);
}

export function featPrerequisiteLabel(feat: FeatDefinition): string {
  const parts = [`niveau ${feat.prerequisite.minLevel}+`];
  if (feat.prerequisite.ability13) parts.push(`${feat.prerequisite.ability13.map((id) => id.toUpperCase()).join(' ou ')} 13+`);
  if (feat.prerequisite.spellcasting) parts.push('Incantation ou Magie de pacte');
  if (feat.prerequisite.armorTraining) parts.push(`armure ${feat.prerequisite.armorTraining.toLowerCase()}`);
  if (feat.prerequisite.shieldTraining) parts.push('bouclier');
  return parts.join(' · ');
}

export function eligibleAbilityOptions(feat: FeatDefinition, context: FeatEligibilityContext): AbilityId[] {
  return feat.abilityOptions.filter((ability) => {
    if (context.abilities[ability] >= feat.abilityMaximum) return false;
    if (feat.id === 'general-resilient' && context.saveProficiencies?.includes(ability)) return false;
    return true;
  });
}

export function isFeatEligible(feat: FeatDefinition, context: FeatEligibilityContext): boolean {
  const prerequisite = feat.prerequisite;
  if (context.level < prerequisite.minLevel) return false;
  if (!feat.repeatable && context.existingFeatIds?.includes(feat.id)) return false;
  if (prerequisite.ability13 && !prerequisite.ability13.some((ability) => context.abilities[ability] >= 13)) return false;
  if (prerequisite.spellcasting && !context.spellcasting) return false;
  if (prerequisite.armorTraining && !context.armorTraining.includes(prerequisite.armorTraining)) return false;
  if (prerequisite.shieldTraining && !context.shieldTraining) return false;
  return eligibleAbilityOptions(feat, context).length > 0;
}

export function eligibleFeats(context: FeatEligibilityContext, includeEpic: boolean): FeatDefinition[] {
  return [...GENERAL_FEATS, ...(includeEpic ? EPIC_BOONS : [])].filter((feat) => isFeatEligible(feat, context));
}
