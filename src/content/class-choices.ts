/**
 * Options de choix de classe et listes de maîtrises — PHB 2024.
 *
 * Repêché de `table-connectee/src/App.jsx`. Ces tables ont été comparées une
 * à une entre le texte source et la sortie construite : toutes identiques
 * sauf `PRIMAL_ORDER`, prise ici dans sa version construite (l'Ordre
 * primordial « Mage » ajoute le modificateur de Sagesse aux tests d'Arcanes
 * et de Nature, et non une simple maîtrise comme le disait le source).
 *
 * Ce sont des choix que le joueur pose sur sa fiche ; leurs effets se
 * dérivent à la lecture, aucun n'est figé à la création.
 */

export interface ChoiceOption {
  id: string;
  name: string;
  desc: string;
  [key: string]: unknown;
}

/** Guerrier · Maître de guerre — manœuvres (niveau 3). */
export const BATTLE_MASTER_MANEUVERS: ChoiceOption[] = [
    {
      "id": "embuscade",
      "name": "Embuscade",
      "desc": "Ajoute le dé de supériorité à un test de Discrétion ou à l’initiative."
    },
    {
      "id": "permutation",
      "name": "Permutation",
      "desc": "Échange ta place avec un allié consentant sans provoquer, puis augmente ta CA ou la sienne du dé."
    },
    {
      "id": "frappe-commandant",
      "name": "Frappe du commandant",
      "desc": "Remplace une attaque : un allié utilise sa réaction pour attaquer et ajoute le dé aux dégâts."
    },
    {
      "id": "presence-commandant",
      "name": "Présence imposante",
      "desc": "Ajoute le dé à un test d’Intimidation, de Représentation ou de Persuasion."
    },
    {
      "id": "desarmante",
      "name": "Attaque désarmante",
      "desc": "Ajoute le dé aux dégâts ; sauvegarde de Force ou la cible lâche un objet tenu."
    },
    {
      "id": "distrayante",
      "name": "Frappe distrayante",
      "desc": "Ajoute le dé aux dégâts et avantage la prochaine attaque d’un autre assaillant."
    },
    {
      "id": "jeu-jambes",
      "name": "Jeu de jambes défensif",
      "desc": "Action bonus : Se désengager et ajouter le dé à la CA jusqu’au prochain tour."
    },
    {
      "id": "feinte",
      "name": "Feinte",
      "desc": "Action bonus : avantage à ta prochaine attaque contre une cible proche et dé ajouté aux dégâts si elle touche."
    },
    {
      "id": "provocation",
      "name": "Attaque provocatrice",
      "desc": "Ajoute le dé aux dégâts ; sauvegarde de Sagesse ou désavantage contre les autres cibles."
    },
    {
      "id": "allonge",
      "name": "Attaque avec allonge",
      "desc": "Action bonus : Foncer ; après 1,50 m en ligne droite, ajoute le dé aux dégâts d’une attaque de mêlée."
    },
    {
      "id": "manoeuvre",
      "name": "Attaque manœuvrante",
      "desc": "Ajoute le dé aux dégâts et permet à un allié de se déplacer par réaction sans provoquer de la cible."
    },
    {
      "id": "menacante",
      "name": "Attaque menaçante",
      "desc": "Ajoute le dé aux dégâts ; sauvegarde de Sagesse ou état Effrayé jusqu’à la fin de ton prochain tour."
    },
    {
      "id": "parade",
      "name": "Parade",
      "desc": "Réaction : réduit les dégâts d’une attaque de mêlée du dé + FOR ou DEX."
    },
    {
      "id": "precision",
      "name": "Attaque précise",
      "desc": "Après une attaque ratée, ajoute le dé au jet d’attaque et peux transformer l’échec en réussite."
    },
    {
      "id": "repoussante",
      "name": "Attaque repoussante",
      "desc": "Ajoute le dé aux dégâts ; une cible G ou moins rate une sauvegarde de Force et recule de 4,50 m."
    },
    {
      "id": "ralliement",
      "name": "Ralliement",
      "desc": "Action bonus : un allié à 9 m gagne le dé + la moitié de ton niveau de guerrier en PV temporaires."
    },
    {
      "id": "riposte",
      "name": "Riposte",
      "desc": "Réaction après une attaque de mêlée ratée contre toi : attaque la créature et ajoute le dé aux dégâts."
    },
    {
      "id": "balayage",
      "name": "Attaque balayante",
      "desc": "Après une touche en mêlée, le dé inflige des dégâts à une seconde cible proche si le jet initial l’aurait touchée."
    },
    {
      "id": "evaluation",
      "name": "Évaluation tactique",
      "desc": "Ajoute le dé à un test d’Histoire, Investigation ou Intuition."
    },
    {
      "id": "renversement",
      "name": "Attaque renversante",
      "desc": "Ajoute le dé aux dégâts ; une cible G ou moins rate une sauvegarde de Force et tombe À terre."
    }
  ];

/** Ensorceleur · Métamagie, avec le coût en points de sorcellerie. */
export const METAMAGIC: (ChoiceOption & { cost: number })[] = [
    {
      "id": "prudent",
      "cost": 1,
      "name": "Sort prudent",
      "desc": "Des créatures de ton choix réussissent automatiquement leur sauvegarde."
    },
    {
      "id": "distant",
      "cost": 1,
      "name": "Sort distant",
      "desc": "Tu doubles la portée, ou tu portes un sort de contact à 9 mètres."
    },
    {
      "id": "renforce",
      "cost": 1,
      "name": "Sort renforcé",
      "desc": "Tu relances des dés de dégâts, jusqu'à ton modificateur de Charisme."
    },
    {
      "id": "prolonge",
      "cost": 1,
      "name": "Sort prolongé",
      "desc": "Tu doubles la durée, jusqu'à 24 heures, et gagnes l'avantage aux jets de concentration."
    },
    {
      "id": "intensifie",
      "cost": 2,
      "name": "Sort intensifié",
      "desc": "Une cible subit un désavantage à sa première sauvegarde contre le sort."
    },
    {
      "id": "accelere",
      "cost": 2,
      "name": "Sort accéléré",
      "desc": "Le temps d'incantation passe d'une action à une action bonus."
    },
    {
      "id": "cible",
      "cost": 1,
      "name": "Sort ciblé",
      "desc": "Tu relances un jet d'attaque de sort raté."
    },
    {
      "id": "subtil",
      "cost": 1,
      "name": "Sort subtil",
      "desc": "Tu lances sans composante verbale, somatique ni matérielle sans coût."
    },
    {
      "id": "transmue",
      "cost": 1,
      "name": "Sort transmuté",
      "desc": "Tu changes le type de dégâts : acide, froid, feu, foudre, poison ou tonnerre."
    },
    {
      "id": "jumele",
      "cost": 1,
      "name": "Sort jumelé",
      "desc": "Un sort à cible unique vise une seconde créature."
    }
  ];

/** Clerc · Ordre divin (niveau 1). */
export const DIVINE_ORDER: ChoiceOption[] = [
    {
      "id": "protecteur",
      "name": "Protecteur",
      "desc": "Maîtrise des armes de guerre et des armures lourdes.",
      "effect": "armures lourdes appliquées"
    },
    {
      "id": "thaumaturge",
      "name": "Thaumaturge",
      "desc": "Un sort mineur supplémentaire, et ton modificateur de Sagesse s'ajoute aux tests d'Arcanes et de Religion."
    }
  ];

/** Druide · Ordre primordial (niveau 1). */
export const PRIMAL_ORDER: ChoiceOption[] = [
    {
      "id": "mage",
      "name": "Mage",
      "desc": "Un sort mineur de Druide supplémentaire. Tu ajoutes ton modificateur de Sagesse (minimum +1) à tes tests d’Intelligence (Arcanes et Nature)."
    },
    {
      "id": "gardien",
      "name": "Gardien",
      "desc": "Maîtrise des armes de guerre et des armures intermédiaires.",
      "effect": "armures intermédiaires appliquées"
    }
  ];

/** Clerc · Frappes bénies (niveau 7). */
export const BLESSED_STRIKES: ChoiceOption[] = [
    {
      "id": "frappe-divine",
      "name": "Frappe divine",
      "desc": "Une fois par tour, une attaque d’arme touchée inflige 1d8 dégâts nécrotiques ou radiants supplémentaires."
    },
    {
      "id": "incantation-puissante",
      "name": "Incantation puissante",
      "desc": "Ajoute ton modificateur de Sagesse aux dégâts de tes sorts mineurs de clerc."
    }
  ];

/** Druide · Furie élémentaire (niveau 7). */
export const ELEMENTAL_FURY: ChoiceOption[] = [
    {
      "id": "frappe-primordiale",
      "name": "Frappe primordiale",
      "desc": "Une fois par tour, une attaque d’arme ou de forme sauvage inflige 1d8 dégâts de froid, feu, foudre ou tonnerre supplémentaires."
    },
    {
      "id": "incantation-puissante",
      "name": "Incantation puissante",
      "desc": "Ajoute ton modificateur de Sagesse aux dégâts de tes sorts mineurs de druide."
    }
  ];

/** Barbare · Cœur sauvage — aspects de bête. */
export const WILD_HEART_ASPECTS: ChoiceOption[] = [
    {
      "id": "hibou",
      "name": "Hibou",
      "desc": "Vision dans le noir de 18 m, ou portée existante augmentée de 18 m."
    },
    {
      "id": "panthere",
      "name": "Panthère",
      "desc": "Vitesse d’escalade égale à ta vitesse."
    },
    {
      "id": "saumon",
      "name": "Saumon",
      "desc": "Vitesse de nage égale à ta vitesse."
    }
  ];

/** Maîtrises d'armure accordées par chaque classe (avant choix de sous-classe ou d'ordre). */
export const ARMOR_PROFICIENCIES: Record<string, unknown> = {
    "barbare": {
      "cats": [
        "Légère",
        "Intermédiaire"
      ],
      "shield": true
    },
    "barde": {
      "cats": [
        "Légère"
      ],
      "shield": false
    },
    "clerc": {
      "cats": [
        "Légère",
        "Intermédiaire"
      ],
      "shield": true
    },
    "druide": {
      "cats": [
        "Légère"
      ],
      "shield": true
    },
    "ensorceleur": {
      "cats": [],
      "shield": false
    },
    "guerrier": {
      "cats": [
        "Légère",
        "Intermédiaire",
        "Lourde"
      ],
      "shield": true
    },
    "magicien": {
      "cats": [],
      "shield": false
    },
    "moine": {
      "cats": [],
      "shield": false
    },
    "occultiste": {
      "cats": [
        "Légère"
      ],
      "shield": false
    },
    "paladin": {
      "cats": [
        "Légère",
        "Intermédiaire",
        "Lourde"
      ],
      "shield": true
    },
    "rodeur": {
      "cats": [
        "Légère",
        "Intermédiaire"
      ],
      "shield": true
    },
    "roublard": {
      "cats": [
        "Légère"
      ],
      "shield": false
    }
  };

/** Maîtrises supplémentaires accordées par certaines sous-classes, à partir d'un niveau donné. */
export const SUBCLASS_PROFICIENCIES: Record<string, unknown> = {
    "Guerrier de la Miséricorde": {
      "from": 3,
      "skills": [
        "intuition",
        "medecine"
      ],
      "tools": [
        "Nécessaire d'herboriste"
      ]
    },
    "Assassin": {
      "from": 3,
      "skills": [],
      "tools": [
        "Nécessaire de déguisement",
        "Nécessaire d'empoisonneur"
      ]
    }
  };

export const ARTISAN_TOOLS: string[] = [
    "Matériel d'alchimiste",
    "Matériel de brasseur",
    "Matériel de calligraphe",
    "Outils de charpentier",
    "Outils de cartographe",
    "Outils de cordonnier",
    "Ustensiles de cuisinier",
    "Outils de souffleur de verre",
    "Outils de joaillier",
    "Outils de tanneur",
    "Outils de maçon",
    "Matériel de peintre",
    "Outils de potier",
    "Outils de forgeron",
    "Outils de rétameur",
    "Outils de tisserand",
    "Outils de sculpteur sur bois"
  ];
export const MUSICAL_INSTRUMENTS: string[] = [
    "Cornemuse",
    "Tambour",
    "Tympanon",
    "Flûte",
    "Cor",
    "Luth",
    "Lyre",
    "Flûte de Pan",
    "Chalemie",
    "Viole"
  ];
export const GAMING_SETS: string[] = [
    "Dés",
    "Échecs draconiques",
    "Jeu de cartes",
    "Jeu des Dragons à trois cartes"
  ];
export const OTHER_TOOLS: string[] = [
    "Nécessaire de déguisement",
    "Nécessaire de contrefaçon",
    "Nécessaire d'herboriste",
    "Outils de navigateur",
    "Nécessaire d'empoisonneur",
    "Outils de voleur"
  ];

/** Toutes les maîtrises d'outils sélectionnables, toutes catégories confondues. */
export const ALL_TOOL_PROFICIENCIES: string[] = [
  ...ARTISAN_TOOLS, ...GAMING_SETS, ...MUSICAL_INSTRUMENTS, ...OTHER_TOOLS,
];

/** Les outils proposés par une origine qui laisse le choix dans une catégorie. */
export const toolChoiceOptions = (category: 'artisan' | 'instrument' | 'gaming'): string[] =>
  category === 'artisan' ? ARTISAN_TOOLS
    : category === 'instrument' ? MUSICAL_INSTRUMENTS
      : GAMING_SETS;
