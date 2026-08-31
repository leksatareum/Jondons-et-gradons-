import type { ClassLevel } from '../domain/multiclassing';

/**
 * Le modèle de personnage : on ne stocke QUE les décisions du joueur.
 *
 * Règle du projet, et raison d'être de la refonte : tout ce qui se calcule —
 * PV maximum, CA, bonus d'attaque, emplacements, sorts toujours préparés,
 * capacités, ressources — est dérivé à la lecture par `derive.ts`, jamais
 * écrit ici. Une règle ajoutée demain s'applique alors rétroactivement aux
 * fiches existantes, sans migration.
 *
 * Contre-exemple hérité de `table-connectee`, qu'il s'agit de ne pas
 * reproduire : sa fiche stockait `hpMax`, `speed`, `hitDie`, `darkvision`,
 * `resistances`, les `slots.max`, le `toHit` de chaque attaque et la liste
 * complète des `features` avec leur texte. Résultat concret : une joueuse
 * occultiste dont le personnage existait avant l'arrivée du choix de pacte
 * ne pouvait plus le choisir — sa fiche portait un état figé que le code
 * n'avait plus le droit de recalculer.
 *
 * Deux natures de données cohabitent ici, et une seule est un « choix » :
 *  - les DÉCISIONS (classe, sous-classe, dons, sorts choisis, terrain…), qui
 *    ne changent que quand le joueur décide ;
 *  - l'ÉTAT VIVANT (PV du moment, ressources dépensées, états subis), qui
 *    change en jeu et n'est dérivable de rien.
 *
 * L'état vivant est stocké en DÉPENSES, jamais en valeurs courantes : on
 * enregistre « 2 emplacements de rang 1 dépensés », pas « il en reste 2 ».
 * Si le maximum change — montée de niveau, caractéristique modifiée, règle
 * corrigée — le restant se recalcule juste ; un `current` figé, lui, serait
 * devenu faux sans que personne ne s'en aperçoive.
 */

export type AbilityScores = {
  str: number; dex: number; con: number; int: number; wis: number; cha: number;
};

/** Un objet dans le sac. Ce que le joueur possède est une décision, pas un calcul. */
export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  /** Id du catalogue, quand l'objet en vient — permet d'en dériver poids, prix, effet. */
  catalogId?: string;
  /** Notes libres du joueur ; le texte de règle, lui, vient du catalogue. */
  note?: string;
  equipped?: boolean;
  attuned?: boolean;
}

/**
 * Choix propres à une classe, indexés par leur clé de choix (`fightingStyle`,
 * `primalOrder`, `invocations`, `terrain`, `hunterPrey`…). Volontairement
 * ouvert : une classe qui gagnera un nouveau choix demain n'exigera pas de
 * migration des fiches, seulement une nouvelle clé lue à la dérivation.
 */
export type ClassChoices = Record<string, string | string[] | null | undefined>;

/**
 * Un sort que le joueur a choisi. Un sort accordé d'office par la classe, la
 * sous-classe, le terrain ou l'espèce n'est jamais stocké : il se dérive.
 *
 * `grantedBy` couvre le cas intermédiaire : un don ou une invocation accorde
 * un sort, mais c'est le joueur qui a choisi LEQUEL (Initié à la magie, Pacte
 * du Grimoire…). Ce choix est une décision, donc stockée — mais elle ne
 * consomme pas le budget de sorts préparés.
 */
export interface ChosenSpell {
  id: string;
  /** Classe qui l'a fait apprendre — décisif en multiclasse. */
  sourceClass: string;
  /** Préparé ou non, pour les classes qui préparent. Sans objet pour les sorts connus. */
  prepared?: boolean;
  /** Origine de l'octroi (`origin`, `class-feature`…) quand le sort est accordé mais choisi. */
  grantedBy?: string;
}

/** État vivant : ce qui change en jeu et ne se dérive de rien. */
export interface LiveState {
  /** Dégâts subis, pas PV restants : PV = max dérivé − dégâts. */
  damageTaken: number;
  temporaryHp: number;
  /** Dés de vie dépensés, par classe. */
  hitDiceSpent: Record<string, number>;
  /** Emplacements dépensés, par rang de sort. */
  spellSlotsSpent: Record<number, number>;
  /** Emplacements de pacte dépensés (réserve distincte de l'Occultiste). */
  pactSlotsSpent: number;
  /** Utilisations dépensées, par clé de ressource (`druide:Forme sauvage`…). */
  resourcesSpent: Record<string, number>;
  conditions: { id: string; detail?: string }[];
  exhaustion: number;
  deathSaves: { success: number; fail: number };
  /**
   * Où en est le personnage tombé à 0 PV.
   *
   * Les seuls compteurs ne suffisent pas à le dire : « stabilisé » se lit à
   * 0 succès / 0 échec exactement comme « vient de tomber », et on peut être
   * stabilisé SANS avoir réussi trois jets (un allié qui réussit un test de
   * Médecine DD 10, une trousse de soins). D'où ce statut à part, plutôt
   * qu'une déduction fausse une fois sur deux.
   *
   * Optionnel : les fiches créées avant cet ajout n'en ont pas, et une fiche
   * debout n'en a pas besoin — voir `etatDeMort` dans `model/death-state.ts`,
   * qui le déduit quand il manque.
   */
  deathStatus?: 'dying' | 'stable' | 'dead' | null;
  heroicInspiration: boolean;
  /** Concentration en cours, s'il y en a une. */
  concentration?: { spellId: string; note?: string } | null;
  /**
   * Forme de bête active, si le personnage est actuellement transformé.
   * L'identité (PV max normaux, attaques normales) n'est pas remplacée : elle
   * reste dérivable, la transformation n'en est qu'un état temporaire.
   */
  activeWildShape?: { formId: string } | null;
  /**
   * Vrai juste après un repos long : un échange de forme apprise contre une
   * autre est possible. Se referme au premier échange, ou dès le prochain
   * repos long si le joueur ne s'en sert pas.
   */
  wildShapeSwapOpen?: boolean;
  /**
   * Courroux de la mer actif (Cercle de la Mer, niveau 3) — PHB 2024 p. 87.
   * Une AUTRE façon de dépenser une utilisation de Forme sauvage, « plutôt
   * que de te métamorphoser » : exclusif avec `activeWildShape` et
   * `formeStellaire`, jamais les deux à la fois.
   */
  courrouxDeLaMer?: boolean;
  /**
   * Forme stellaire active (Cercle des Étoiles, niveau 3) — PHB 2024 p. 88-89.
   * Garde les statistiques du personnage ; seule la constellation choisie
   * change ce qu'elle ajoute. Exclusive avec `activeWildShape` et
   * `courrouxDeLaMer`, pour la même raison.
   */
  formeStellaire?: { constellation: 'archer' | 'calice' | 'dragon' } | null;
  /**
   * Identité du tour (`turnIdentity`) où Résurgence sauvage a déjà converti un
   * emplacement en utilisation de Forme sauvage. La règle l'autorise « une
   * fois au maximum pendant chacun des tours du Druide » : il faut donc savoir
   * DE QUEL tour on parle, pas seulement qu'elle a servi.
   */
  wildResurgenceTurn?: string | null;
  /**
   * La marque du chasseur en cours, s'il y en a une.
   *
   * C'est un véritable état de jeu, pas une condition textuelle : quatre
   * capacités du Rôdeur le lisent (Chasseur implacable 13, Chasseur précis 17,
   * Tueur d'ennemis 20, Maître des bêtes 11).
   */
  huntersMark?: HuntersMark | null;
  /**
   * Vrai quand le MJ a autorisé une montée de niveau : le personnage a
   * gagné assez d'XP ou franchi le jalon, mais les choix qui vont avec
   * (jet de vie, sous-classe, augmentation ou don, invocations…) restent au
   * joueur — jamais au MJ. Ce drapeau n'est qu'un déclencheur ; il n'ouvre
   * `LevelUpDialog` que sur l'écran du joueur, et se referme dès qu'il l'a
   * traversé (voir `SheetView`).
   */
  levelUpUnlocked?: boolean;
  /**
   * Maîtrise d'armes verrouillée depuis le dernier repos long — PHB 2024
   * p. 120 (« tu détermines les armes concernées à la fin de chaque repos
   * long ») : le choix se fait au réveil, pas au fil de la journée. Absent
   * ou `false` : ouvert — une fiche fraîchement créée doit pouvoir choisir
   * sans qu'on lui impose d'abord un repos long fictif. Se referme au
   * premier repos court (le temps a passé dans la journée d'aventure) et se
   * rouvre à chaque repos long.
   */
  weaponMasteriesLocked?: boolean;
}

/**
 * Marque du chasseur — sort de niveau 1, Divination, concentration.
 *
 * `dieSides` n'est pas stocké : il se dérive du niveau de Rôdeur (1d6, et
 * 1d10 au niveau 20 par Tueur d'ennemis). Stocker un dé fige une valeur qui
 * doit suivre le personnage.
 */
export interface HuntersMark {
  /** Qui est marqué. L'identifiant d'un combattant de la rencontre, ou un nom saisi. */
  targetId: string;
  /** Nom lisible de la cible, pour l'afficher sans dépendre de la rencontre. */
  targetName: string;
  /** Ce qui a payé le lancement : une utilisation gratuite d'Ennemi juré, ou un emplacement. */
  source: 'ennemi-jure' | 'emplacement';
  /** Rang de l'emplacement dépensé, quand c'en est un — il fixe la durée. */
  slotLevel?: number;
  /** Durée en heures : 1, 8 ou 24 selon le rang employé. */
  durationHours: number;
}

/**
 * Un sort accordé en jeu, avec ses propres lancements gratuits.
 *
 * Volontairement séparé de `spells` : un sort accordé ne se prépare pas, ne
 * consomme aucun emplacement, et ne suit pas les règles de réouverture de la
 * classe. Le ranger dans la même liste obligerait chaque règle sur les sorts
 * préparés à porter une exception, et c'est l'exception qu'on oublie.
 */
export interface SpellGrant {
  /** Identifiant du don lui-même : ce qu'on retire pour le révoquer. */
  id: string;
  spellId: string;
  /** D'où ça vient, en clair. « Génie du désert », « Parchemin de la crypte ». */
  source: string;
  /** Lancements gratuits avant recharge. */
  uses: number;
  recharge: 'court' | 'long';
  /** Quand le don a été fait, pour retrouver la séance correspondante. */
  grantedAt: string;
}

export interface CharacterSheet {
  id: string;
  name: string;
  /**
   * Portrait choisi par le joueur — une URL publique dans le bucket Supabase
   * `portraits`, jamais un fichier local : la fiche doit rester ce qu'elle a
   * toujours été, un JSON qui voyage, pas une image embarquée qui l'alourdit.
   * Absent ou `null` : la fiche retombe sur un médaillon générique.
   */
  portraitUrl?: string | null;

  // ── Décisions de création ────────────────────────────────────────────
  speciesId: string;
  /** Lignage (Drow, Haut-elfe, Legs infernal…), si l'espèce en propose. */
  lineageId?: string | null;
  /** Ascendance (dragon rouge, faveur de géant…), si l'espèce en propose. */
  ancestryId?: string | null;
  /** `'TP' | 'P' | 'M' | 'G'` — voir `content/species.ts`, `sizesFor`. */
  size?: string | null;
  backgroundId: string;
  /** Caractéristiques de base, telles que réparties à la création. */
  abilities: AbilityScores;
  alignment?: string | null;
  /**
   * L'histoire du personnage, écrite par le joueur — d'où il vient, ce qui
   * l'a mené là. Texte libre, jamais dérivé de rien : contrairement au fond
   * (`backgroundId`, une mécanique de règle), c'est du roman, pas une
   * décision de fiche.
   */
  history?: string;

  // ── Décisions de progression ─────────────────────────────────────────
  /** Niveaux par classe, avec la sous-classe choisie. Multiclasse dès l'origine. */
  classLevels: ClassLevel[];
  /** Choix propres à chaque classe, indexés par identifiant de classe. */
  classChoices: Record<string, ClassChoices>;
  /** Compétences dont la maîtrise a été choisie (hors celles accordées d'office). */
  skillProficiencies: string[];
  expertise: string[];
  toolProficiencies: string[];
  languages: string[];
  /** Dons choisis, hors don d'origine — celui-ci est dérivé de `backgroundId`. */
  featIds: string[];
  /** Augmentations de caractéristiques choisies, cumulées à `abilities` par dérivation. */
  abilityImprovements: Partial<AbilityScores>[];

  // ── Décisions de magie et d'équipement ───────────────────────────────
  cantrips: { id: string; sourceClass: string }[];
  spells: ChosenSpell[];
  inventory: InventoryItem[];
  /**
   * Points de vie gagnés à chaque niveau après le premier, quand ils ont été
   * *jetés* plutôt que pris à la moyenne fixe. Un jet de dé est un fait
   * historique : il ne se dérive de rien, il se stocke — au même titre qu'une
   * décision. Absent ou incomplet, la dérivation applique la moyenne fixe.
   */
  hitPointRolls?: number[];

  /**
   * Total de PV maximum imposé, qui court-circuite la dérivation.
   *
   * C'est la SEULE valeur de cette fiche qui masque un calcul, et elle n'est
   * là que pour l'import : `table-connectee` ne stockait qu'un `hpMax` global,
   * sans le détail des jets, donc l'historique est irrécupérable. Choisir la
   * moyenne à sa place changerait silencieusement les PV d'un personnage
   * joué — inacceptable. À la première montée de niveau, le joueur remplit
   * `hitPointRolls` et efface ce champ ; la dérivation reprend la main.
   */
  maxHpOverride?: number | null;

  /**
   * Sorts accordés par le MJ au fil du scénario — un génie, un maître, une
   * relique.
   *
   * Une décision, comme le reste de cette fiche : ce n'est pas un état qu'on
   * dépense, c'est un fait acquis en jeu. Ce que le personnage en a consommé
   * aujourd'hui vit dans `live.resourcesSpent`, avec la clé du don.
   *
   * Le seul endroit de la fiche qu'un joueur ne remplit pas lui-même. La
   * source est libre et obligatoire : six mois plus tard, « pourquoi ce rôdeur
   * a-t-il Boule de feu » doit avoir une réponse sur la fiche elle-même.
   */
  grants?: SpellGrant[];

  /** Armure portée ; `null` ou `'none'` si aucune. La CA, elle, est dérivée. */
  armorId?: string | null;
  shield: boolean;
  gold: number;

  /**
   * L'arme en main — id du catalogue (`content/weapons.ts`), indépendant du
   * sac : le sac est en texte libre, jamais relié au catalogue, alors qu'une
   * attaque a besoin de connaître précisément l'arme pour calculer son bonus
   * et ses dégâts. Une seule à la fois — on ne manie pas une épée longue et
   * un arc en même temps — `null`/absent : seule l'attaque à mains nues reste
   * proposée, toujours disponible, elle.
   *
   * Changer d'arme HORS combat est libre (on ajuste son équipement entre deux
   * scènes) ; EN combat, ça passe par une carte d'Action dans l'écran de
   * combat, qui coûte l'Action du tour comme n'importe quelle autre carte.
   */
  equippedWeaponId?: string | null;

  // ── État vivant ──────────────────────────────────────────────────────
  live: LiveState;

  /**
   * Formes de bête apprises (Forme sauvage) : une décision du joueur, plafonnée
   * par le niveau de Druide. Absent ou vide : la fiche n'a encore rien choisi,
   * et propose alors une sélection de départ raisonnable.
   */
  wildShapeKnownForms?: string[];

  /**
   * Créatures liées au personnage : familier, compagnon primordial du Maître
   * des bêtes. Un seul élément par famille (`family`) tient à la fois — en
   * lier un nouveau remplace l'ancien de la même famille, jamais ne l'empile.
   */
  companions?: LinkedCreature[];

  /** Provenance, quand la fiche vient d'un import. Utile pour tracer un écart. */
  importedFrom?: { app: string; importedAt: string; legacyId?: string };
}

/**
 * Une créature liée à un personnage — familier ou compagnon primordial.
 *
 * Comme un combattant de rencontre (`Combatant`), elle mêle volontairement
 * identité et état vivant en un seul objet plutôt que de dériver ses PV à la
 * lecture : ses dégâts se suivent dans le temps, au même titre que ceux du
 * personnage, et rien ne les recalcule à partir de rien à chaque rendu.
 */
export interface LinkedCreature {
  id: string;
  templateId: string;
  /** L'option de `linkedCreatureOptionsFor` qui a produit cette créature. */
  sourceOptionId: string;
  source: 'find-familiar' | 'wild-companion' | 'pact-chain' | 'primal-companion';
  sourceLabel: string;
  family: 'familiar' | 'primal-companion';
  name: string;
  ac: number;
  hp: number;
  hpMax: number;
  speed: string;
  cr: string;
  kind: string;
  /** Vrai pour un Compagnon sauvage : il disparaît au repos long. */
  expiresOnLongRest: boolean;
  initiativeMode: 'independent' | 'during-owner-turn';
  commandMode: string;
  attackBonus?: number;
  damageFormula?: string;
  saveDc?: number;
  rules: string[];
  /** Compagnon primordial seulement : un repos long vient d'ouvrir la possibilité d'en changer. */
  swapReady: boolean;
  conditions: { id: string; detail?: string }[];
}

export const EMPTY_LIVE_STATE: LiveState = {
  damageTaken: 0,
  temporaryHp: 0,
  hitDiceSpent: {},
  spellSlotsSpent: {},
  pactSlotsSpent: 0,
  resourcesSpent: {},
  conditions: [],
  exhaustion: 0,
  deathSaves: { success: 0, fail: 0 },
  deathStatus: null,
  heroicInspiration: false,
  concentration: null,
  wildResurgenceTurn: null,
  huntersMark: null,
};

/** Modificateur d'une valeur de caractéristique. */
export const abilityModifier = (score: number): number => Math.floor((score - 10) / 2);

/** Caractéristiques effectives : base + augmentations choisies, plafonnées à 20. */
export const effectiveAbilities = (sheet: Pick<CharacterSheet, 'abilities' | 'abilityImprovements'>): AbilityScores => {
  const result = { ...sheet.abilities };
  for (const improvement of sheet.abilityImprovements ?? []) {
    for (const [ability, bonus] of Object.entries(improvement)) {
      const key = ability as keyof AbilityScores;
      result[key] = Math.min(20, (result[key] ?? 10) + (bonus ?? 0));
    }
  }
  return result;
};

/** Niveau total, toutes classes confondues. */
export const totalLevel = (sheet: Pick<CharacterSheet, 'classLevels'>): number =>
  sheet.classLevels.reduce((sum, entry) => sum + entry.level, 0);

/** Niveau atteint dans une classe donnée, 0 si elle n'est pas prise. */
export const levelInClass = (sheet: Pick<CharacterSheet, 'classLevels'>, classId: string): number =>
  sheet.classLevels.find((entry) => entry.classId === classId)?.level ?? 0;

/** Sous-classe choisie pour une classe donnée. */
export const subclassOf = (sheet: Pick<CharacterSheet, 'classLevels'>, classId: string): string | null =>
  sheet.classLevels.find((entry) => entry.classId === classId)?.subclass ?? null;

/** Choix enregistrés pour une classe, jamais `undefined` pour simplifier les appelants. */
export const choicesFor = (sheet: Pick<CharacterSheet, 'classChoices'>, classId: string): ClassChoices =>
  sheet.classChoices?.[classId] ?? {};

/** Un choix multiple, toujours rendu sous forme de liste. */
export const choiceList = (choices: ClassChoices, key: string): string[] => {
  const value = choices[key];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [String(value)] : [];
};
