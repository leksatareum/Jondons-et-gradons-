/**
 * Sorts toujours préparés — PHB 2024. Accordés par la sous-classe, la classe
 * ou le terrain choisi ; ils s'ajoutent au budget de sorts au lieu de le
 * consommer (cf. `docs/legacy-rules-backlog.md`, §2, bug « Liste 9/6 »).
 *
 * ⚠️ Repêché de la SORTIE CONSTRUITE de `table-connectee/src/App.jsx`, pas de
 * son texte source : la chaîne de plugins ajoute à la compilation les quatre
 * tables des Patrons de l'Occultiste (Archifée, Céleste, Fiélon, Grand Ancien)
 * et l'entrée `occultiste` de `CLASS_ALWAYS_SPELLS`. Lire le source seul les
 * aurait purement et simplement perdues — c'est-à-dire toute la magie de
 * patron de la classe jouée à cette table. Littéraux évalués depuis la sortie
 * construite puis sérialisés, jamais recopiés à la main.
 *
 * Chaque entrée est une liste de paliers `[niveau minimum, ids de sorts]`.
 */

export type AlwaysPreparedTier = [level: number, spellIds: string[]];

/** Accordés par la sous-classe (cercle druidique, patron occultiste, serment…). */
export const SUBCLASS_ALWAYS_SPELLS: Record<string, AlwaysPreparedTier[]> = {
  "Patron Archifée": [
    [3, ['apaisement', 'lueurs-feeriques', 'pas-brumeux', 'force-fantasmagorique', 'sommeil']],
    [5, ['clignotement', 'croissance-vegetale']],
    [7, ['domination-bete', 'invisibilite-superieure']],
    [9, ['domination-personne', 'apparence']],
  ],
  "Patron Céleste": [
    [3, ['aide', 'soins', 'trait-lumiere', 'restauration-partielle', 'lumiere', 'flamme-sacree']],
    [5, ['lumiere-jour', 'reviviscence']],
    [7, ['gardien-foi', 'mur-feu']],
    [9, ['restauration-superieure', 'invocation-celeste']],
  ],
  "Patron Fiélon": [
    [3, ['mains-brulantes', 'injonction', 'rayon-ardent', 'suggestion']],
    [5, ['boule-feu', 'nuage-poison']],
    [7, ['bouclier-flammes', 'mur-feu']],
    [9, ['geas', 'insectes']],
  ],
  "Patron Grand Ancien": [
    [3, ['detection-pensees', 'murmures-dissonants', 'force-fantasmagorique', 'rire-hideux']],
    [5, ['clairvoyance', 'faim-hadar']],
    [7, ['confusion', 'invocation-aberration']],
    [9, ['modification-memoire', 'telekinesie']],
    [10, ['malefice']],
  ],
  "Sorcellerie aberrante": [
    [3, ['bras-hadar', 'apaisement', 'detection-pensees', 'murmures-dissonants', 'eclat-mental']],
    [5, ['faim-hadar', 'sending']],
    [7, ['tentacules-noirs', 'invocation-aberration']],
    [9, ['lien-telepathique-rary', 'telekinesie']],
  ],
  "Sorcellerie mécanique": [
    [3, ['aide', 'alarme', 'restauration-partielle', 'protection-mal-bien']],
    [5, ['dissipation-magie', 'protection-energie']],
    [7, ['liberte-mouvement', 'invocation-artificiel']],
    [9, ['restauration-superieure', 'mur-force']],
  ],
  "Sorcellerie draconique": [
    [3, ['metamorphose-mineure', 'orbe-chromatique', 'injonction', 'souffle-dragon']],
    [5, ['peur', 'vol']],
    [7, ['oeil-arcanique', 'charme-monstre']],
    [9, ['connaissance-legendes', 'invocation-dragon']],
  ],
  "Collège du Charme": [
    [3, ['charme-personne', 'image-miroir']],
    [6, ['injonction']],
  ],
  "Domaine de la Vie": [
    [3, ['aide', 'benediction', 'soins', 'restauration-partielle']],
    [5, ['mot-guerison-groupe', 'reviviscence']],
    [7, ['aura-vie', 'protection-mort']],
    [9, ['restauration-superieure', 'soin-groupe-mass']],
  ],
  "Domaine de la Lumière": [
    [3, ['mains-brulantes', 'lueurs-feeriques', 'rayon-ardent', 'voir-invisible']],
    [5, ['lumiere-jour', 'boule-feu']],
    [7, ['oeil-arcanique', 'mur-feu']],
    [9, ['colonne-flamme', 'scrutation']],
  ],
  "Domaine de la Duperie": [
    [3, ['charme-personne', 'deguisement', 'invisibilite', 'passage-sans-trace']],
    [5, ['hypnose', 'nondetection']],
    [7, ['confusion', 'porte-dimension']],
    [9, ['domination-personne', 'modification-memoire']],
  ],
  "Domaine de la Guerre": [
    [3, ['trait-lumiere', 'arme-magique', 'bouclier-foi', 'arme-spirituelle']],
    [5, ['manteau-croise', 'esprit-lame']],
    [7, ['bouclier-flammes', 'liberte-mouvement']],
    [9, ['immobilisation-monstre', 'frappe-vent-acier']],
  ],
  "Serment de Dévotion": [
    [3, ['protection-mal-bien', 'bouclier-foi']],
    [5, ['aide', 'zone-verite']],
    [9, ['balise-espoir', 'dissipation-magie']],
    [13, ['liberte-mouvement', 'gardien-foi']],
    [17, ['communion', 'colonne-flamme']],
  ],
  "Serment de Gloire": [
    [3, ['trait-lumiere', 'heroisme']],
    [5, ['amelioration-caracteristique', 'arme-magique']],
    [9, ['hate', 'protection-energie']],
    [13, ['contrainte', 'liberte-mouvement']],
    [17, ['connaissance-legendes', 'presence-royale-yolande']],
  ],
  "Serment des Anciens": [
    [3, ['frappe-entravante', 'parler-animaux']],
    [5, ['pas-brumeux', 'lueur-lune']],
    [9, ['croissance-vegetale', 'protection-energie']],
    [13, ['tempete-grele', 'peau-pierre']],
    [17, ['communion-nature', 'foulee-arbres']],
  ],
  "Serment de Vengeance": [
    [3, ['fleau', 'marque-chasseur']],
    [5, ['immobilisation-personne', 'pas-brumeux']],
    [9, ['hate', 'protection-energie']],
    [13, ['bannissement', 'porte-dimension']],
    [17, ['immobilisation-monstre', 'scrutation']],
  ],
  "Cercle de la Lune": [
    [3, ['soins', 'lueur-lune', 'etincelle-etoilee']],
    [5, ['appel-animaux']],
    [7, ['source-clair-lune']],
    [9, ['soin-groupe-mass']],
  ],
  "Cercle de la Mer": [
    [3, ['brouillard', 'gust-vent', 'rayon-givre', 'fracassement', 'vague-tonnante']],
    [5, ['eclair', 'respiration-aquatique']],
    [7, ['controle-eau', 'tempete-grele']],
    [9, ['appel-elementaire', 'immobilisation-monstre']],
  ],
  "Cercle des Étoiles": [
    [3, ['assistance', 'trait-lumiere']],
  ],
  "Vagabond féerique": [
    [3, ['charme-personne']],
    [5, ['pas-brumeux']],
    [9, ['invocation-fee']],
    [13, ['porte-dimension']],
    [17, ['leurre']],
  ],
  "Traqueur des ténèbres": [
    [3, ['deguisement']],
    [5, ['corde-animee']],
    [9, ['peur']],
    [13, ['invisibilite-superieure']],
    [17, ['apparence']],
  ],
};

/**
 * Cercle de la Terre : le type de terre se choisit et se rechoisit à chaque
 * repos long, d'où une table à part plutôt qu'une entrée de sous-classe.
 */
export const TERRAIN_ALWAYS_SPELLS: Record<string, AlwaysPreparedTier[]> = {
  "aride": [
    [3, ['flou', 'mains-brulantes', 'trait-feu']],
    [5, ['boule-feu']],
    [7, ['fletrissement']],
    [9, ['mur-pierre']],
  ],
  "polaire": [
    [3, ['brouillard', 'immobilisation-personne', 'rayon-givre']],
    [5, ['tempete-neige']],
    [7, ['tempete-grele']],
    [9, ['cone-froid']],
  ],
  "temperee": [
    [3, ['pas-brumeux', 'toucher-choc', 'sommeil']],
    [5, ['eclair']],
    [7, ['liberte-mouvement']],
    [9, ['foulee-arbres']],
  ],
  "tropicale": [
    [3, ['aspersion-acide', 'rayon-maladie', 'toile-araignee']],
    [5, ['nuage-poison']],
    [7, ['polymorphe']],
    [9, ['insectes']],
  ],
};

/** Accordés par la classe elle-même, indépendamment de la sous-classe. */
export const CLASS_ALWAYS_SPELLS: Record<string, AlwaysPreparedTier[]> = {
  "occultiste": [
    [9, ['contact-autre-plan']],
  ],
  "rodeur": [
    [1, ['marque-chasseur']],
  ],
  "druide": [
    [1, ['parler-animaux']],
  ],
  "paladin": [
    [2, ['chatiment-divin']],
    [5, ['destrier']],
  ],
  "barde": [
    [20, ['mot-pouvoir-guerison', 'mot-pouvoir-mort']],
  ],
};

export const DRUID_TERRAINS = ['aride', 'polaire', 'temperee', 'tropicale'] as const;
export type DruidTerrain = typeof DRUID_TERRAINS[number];

const tiersUpTo = (tiers: AlwaysPreparedTier[] | undefined, level: number): string[] =>
  (tiers ?? []).filter(([from]) => level >= from).flatMap(([, ids]) => ids);

/**
 * Tous les sorts toujours préparés d'un personnage, dérivés à la lecture de
 * ses seules décisions (classe, sous-classe, terrain) et de son niveau. Une
 * entrée ajoutée demain s'applique rétroactivement, sans migration de fiche.
 */
export function alwaysPreparedSpellsFor(input: {
  classId?: string | null;
  subclass?: string | null;
  terrain?: string | null;
  level: number;
}): string[] {
  const { classId, subclass, terrain, level } = input;
  return [...new Set([
    ...tiersUpTo(classId ? CLASS_ALWAYS_SPELLS[classId] : undefined, level),
    ...tiersUpTo(subclass ? SUBCLASS_ALWAYS_SPELLS[subclass] : undefined, level),
    ...tiersUpTo(terrain ? TERRAIN_ALWAYS_SPELLS[terrain] : undefined, level),
  ])];
}
