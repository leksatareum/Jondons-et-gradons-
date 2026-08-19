/**
 * Les 14 états officiels du PHB 2024 (l'Épuisement est un compteur numérique
 * à part, pas un état booléen — voir `rules-compendium.ts`, entrée
 * `health-exhaustion`). Repêché de `table-connectee/src/App.jsx`
 * (`CONDITIONS`) — seuls les états canoniques sont repris ici ; les autres
 * entrées de la table d'origine (Rage, Forme sauvage, Sorcellerie innée…)
 * sont des étiquettes de suivi d'affichage pour des mécaniques déjà
 * couvertes ailleurs dans ce dépôt, pas des règles à extraire séparément.
 *
 * `attack`/`check` : effet sur tes propres jets. `incoming` : ce que
 * gagnent ceux qui t'attaquent. `autoFail` : sauvegardes ratées d'office.
 * Confiance haute pour les 14 états — sémantique stable depuis 2014.
 *
 * ⚠️ Une exception, à vérifier : le code d'origine donne à Agrippé un
 * désavantage sur les attaques contre une cible autre que le agrippeur
 * (`attack: 'dis'`). Je ne retrouve pas cet effet dans la règle officielle
 * du PHB (Agrippé se limite normalement à réduire la vitesse à 0) — ça
 * ressemble à un ajout maison plausible, pas à une erreur évidente. Porté
 * tel quel, mais marqué : à confirmer si tu veux la jouer stricte RAW ou
 * garder l'ajout.
 */
export type ConditionId =
  | 'aveugle' | 'charme' | 'effraye' | 'empoisonne' | 'a-terre' | 'entrave' | 'etourdi'
  | 'inconscient' | 'agrippe' | 'assourdi' | 'incapable-agir' | 'invisible' | 'paralyse' | 'petrifie';

export interface ConditionEffect {
  name: string;
  attack?: 'adv' | 'dis';
  check?: 'adv' | 'dis';
  incoming?: 'adv' | 'dis';
  incapacitated?: boolean;
  speed0?: boolean;
  prone?: boolean;
  resistAll?: boolean;
  autoFail?: AbilitySaveShorthand[];
  saveDis?: AbilitySaveShorthand[];
  note: string;
}

type AbilitySaveShorthand = 'str' | 'dex';

export const CONDITIONS: Record<ConditionId, ConditionEffect> = {
  'aveugle': { name: 'Aveuglé', attack: 'dis', incoming: 'adv', note: 'Tu rates automatiquement tout test nécessitant la vue.' },
  'charme': { name: 'Charmé', note: "Tu ne peux pas attaquer le charmeur, qui a l'avantage à ses tests sociaux contre toi." },
  'effraye': { name: 'Effrayé', attack: 'dis', check: 'dis', note: "Tant que la source de ta peur est en vue. Tu ne peux pas t'en approcher." },
  'empoisonne': { name: 'Empoisonné', attack: 'dis', check: 'dis', note: 'Désavantage aux attaques et aux tests de caractéristique.' },
  'a-terre': { name: 'À terre', attack: 'dis', note: "Attaquants à 1,50 m : avantage. Attaquants à distance : désavantage. Te relever coûte la moitié de ton mouvement." },
  'entrave': { name: 'Entravé', attack: 'dis', incoming: 'adv', saveDis: ['dex'], note: 'Ta vitesse tombe à 0.' },
  'etourdi': { name: 'Étourdi', incapacitated: true, speed0: true, incoming: 'adv', autoFail: ['str', 'dex'], note: "Tu es incapable d'agir et ne peux ni bouger ni parler normalement." },
  'inconscient': { name: 'Inconscient', incapacitated: true, speed0: true, prone: true, incoming: 'adv', autoFail: ['str', 'dex'], note: 'Incapable d\'agir, à terre, vitesse 0. Les coups portés à 1,50 m sont des critiques automatiques.' },
  // ⚠️ voir l'avertissement en tête de fichier : `attack: 'dis'` n'est pas dans la règle officielle.
  'agrippe': { name: 'Agrippé', attack: 'dis', speed0: true, note: "Ta vitesse tombe à 0. Désavantage aux attaques contre une autre cible que celle qui t'agrippe." },
  'assourdi': { name: 'Assourdi', note: "Tu n'entends rien et rates automatiquement tout test reposant sur l'ouïe." },
  'incapable-agir': { name: "Incapable d'agir", incapacitated: true, note: "Ni action, ni action bonus, ni réaction. Tu ne peux pas parler et ta concentration est rompue. Désavantage à l'initiative." },
  'invisible': { name: 'Invisible', attack: 'adv', incoming: 'dis', note: "Avantage à tes attaques, désavantage à celles qui te visent. Avantage à l'initiative si tu es invisible au moment de la lancer." },
  'paralyse': { name: 'Paralysé', incapacitated: true, speed0: true, incoming: 'adv', autoFail: ['str', 'dex'], note: 'Incapable d\'agir, vitesse 0. Les coups portés à 1,50 m sont des critiques automatiques.' },
  'petrifie': { name: 'Pétrifié', incapacitated: true, speed0: true, incoming: 'adv', autoFail: ['str', 'dex'], resistAll: true, note: "Incapable d'agir, vitesse 0, résistance à tous les dégâts, immunité à l'état Empoisonné. Tu cesses de vieillir." },
};
