/**
 * Équipement de départ par classe, et correspondances d'artisanat — PHB 2024.
 *
 * Repêché de `table-connectee/src/App.jsx`. Ces tables sont identiques entre
 * le texte source et la sortie construite (vérifié table par table), aucun
 * plugin ne les réécrit.
 *
 * Le kit de départ n'est pas une règle dérivable : c'est un choix ponctuel
 * fait à la création, dont le résultat (les objets dans le sac) devient une
 * décision du joueur stockée sur la fiche. Ces tables ne servent donc qu'à
 * *proposer* le contenu au moment du choix, jamais à le recalculer ensuite.
 */

/** Équipement proposé à la création, par classe. */
export const STARTING_KITS: Record<string, unknown> = {
    "barbare": {
      "verified": true,
      "gold": 75,
      "kit": [
        {
          "name": "Grande hache",
          "qty": 1,
          "weight": 3.2,
          "desc": "Lourde, deux mains."
        },
        {
          "name": "Hachette",
          "qty": 4,
          "weight": 0.9,
          "desc": "Légère, lancer (6/18)."
        },
        {
          "name": "Sacoche d'explorateur",
          "qty": 1,
          "weight": 25,
          "desc": "Matériel de voyage et de bivouac."
        }
      ],
      "kitGold": 15
    },
    "barde": {
      "verified": true,
      "gold": 90,
      "kit": [
        {
          "name": "Armure de cuir",
          "qty": 1,
          "weight": 4.5,
          "desc": "CA 11 + Dextérité.",
          "armorId": "cuir"
        },
        {
          "name": "Dague",
          "qty": 2,
          "weight": 0.5,
          "desc": "Finesse, légère, lancer (6/18)."
        },
        {
          "name": "Instrument de musique au choix",
          "qty": 1,
          "weight": 1,
          "desc": "Instrument choisi parmi tes maîtrises."
        },
        {
          "name": "Sacoche d'artiste",
          "qty": 1,
          "weight": 18,
          "desc": "Accessoires et matériel de spectacle."
        }
      ],
      "kitGold": 19
    },
    "clerc": {
      "verified": true,
      "gold": 110,
      "kit": [
        {
          "name": "Chemise de mailles",
          "qty": 1,
          "weight": 9,
          "desc": "CA 13 + Dextérité (maximum 2).",
          "armorId": "chemise"
        },
        {
          "name": "Bouclier",
          "qty": 1,
          "weight": 2.7,
          "desc": "+2 à la CA.",
          "shield": true
        },
        {
          "name": "Masse d'armes",
          "qty": 1,
          "weight": 1.8,
          "desc": "Arme simple contondante."
        },
        {
          "name": "Symbole sacré",
          "qty": 1,
          "weight": 0.5,
          "desc": "Focaliseur divin."
        },
        {
          "name": "Sacoche de prêtre",
          "qty": 1,
          "weight": 12,
          "desc": "Matériel religieux et de voyage."
        }
      ],
      "kitGold": 7
    },
    "druide": {
      "verified": true,
      "gold": 50,
      "kit": [
        {
          "name": "Armure de cuir",
          "qty": 1,
          "weight": 4.5,
          "desc": "CA 11 + Dextérité.",
          "armorId": "cuir"
        },
        {
          "name": "Bouclier",
          "qty": 1,
          "weight": 2.7,
          "desc": "+2 à la CA.",
          "shield": true
        },
        {
          "name": "Serpe",
          "qty": 1,
          "weight": 0.9,
          "desc": "Légère."
        },
        {
          "name": "Bâton de combat (focaliseur druidique)",
          "qty": 1,
          "weight": 1.8,
          "desc": "Arme et focaliseur druidique."
        },
        {
          "name": "Sacoche d'explorateur",
          "qty": 1,
          "weight": 25,
          "desc": "Matériel de voyage et de bivouac."
        },
        {
          "name": "Trousse d'herboriste",
          "qty": 1,
          "weight": 1.4,
          "desc": "Outils de préparation et de récolte."
        }
      ],
      "kitGold": 9
    },
    "guerrier": {
      "verified": true,
      "gold": 155,
      "kit": [
        {
          "name": "Cotte de mailles",
          "qty": 1,
          "weight": 25,
          "desc": "CA 16.",
          "armorId": "mailles"
        },
        {
          "name": "Espadon",
          "qty": 1,
          "weight": 2.7,
          "desc": "Lourde, deux mains."
        },
        {
          "name": "Fléau",
          "qty": 1,
          "weight": 0.9,
          "desc": "Arme martiale contondante."
        },
        {
          "name": "Javeline",
          "qty": 8,
          "weight": 0.9,
          "desc": "Lancer (9/36)."
        },
        {
          "name": "Sacoche d'exploration souterraine",
          "qty": 1,
          "weight": 27,
          "desc": "Matériel de donjon."
        }
      ],
      "kitGold": 4,
      "alternatives": [
        {
          "id": "b",
          "label": "Paquet B · archer",
          "kit": [
            {
              "name": "Armure de cuir clouté",
              "qty": 1,
              "weight": 6,
              "desc": "CA 12 + Dextérité.",
              "armorId": "cuirclou"
            },
            {
              "name": "Cimeterre",
              "qty": 1,
              "weight": 1.4,
              "desc": "Finesse, légère."
            },
            {
              "name": "Épée courte",
              "qty": 1,
              "weight": 0.9,
              "desc": "Finesse, légère."
            },
            {
              "name": "Arc long",
              "qty": 1,
              "weight": 0.9,
              "desc": "Munitions, lourde, deux mains."
            },
            {
              "name": "Flèches",
              "qty": 20,
              "weight": 0.05,
              "desc": "Munitions pour arc."
            },
            {
              "name": "Carquois",
              "qty": 1,
              "weight": 0.5,
              "desc": "Contient les flèches."
            },
            {
              "name": "Sacoche d'exploration souterraine",
              "qty": 1,
              "weight": 27,
              "desc": "Matériel de donjon."
            }
          ],
          "kitGold": 11
        }
      ]
    },
    "moine": {
      "verified": true,
      "gold": 50,
      "kit": [
        {
          "name": "Lance",
          "qty": 1,
          "weight": 1.4,
          "desc": "Lancer (6/18), polyvalente."
        },
        {
          "name": "Dague",
          "qty": 5,
          "weight": 0.5,
          "desc": "Finesse, légère, lancer (6/18)."
        },
        {
          "name": "Outils d'artisan ou instrument",
          "qty": 1,
          "weight": 1,
          "desc": "Correspond à la maîtrise choisie."
        },
        {
          "name": "Sacoche d'explorateur",
          "qty": 1,
          "weight": 25,
          "desc": "Matériel de voyage et de bivouac."
        }
      ],
      "kitGold": 11
    },
    "paladin": {
      "verified": true,
      "gold": 150,
      "kit": [
        {
          "name": "Cotte de mailles",
          "qty": 1,
          "weight": 25,
          "desc": "CA 16.",
          "armorId": "mailles"
        },
        {
          "name": "Bouclier",
          "qty": 1,
          "weight": 2.7,
          "desc": "+2 à la CA.",
          "shield": true
        },
        {
          "name": "Épée longue",
          "qty": 1,
          "weight": 1.4,
          "desc": "Polyvalente."
        },
        {
          "name": "Javeline",
          "qty": 6,
          "weight": 0.9,
          "desc": "Lancer (9/36)."
        },
        {
          "name": "Symbole sacré",
          "qty": 1,
          "weight": 0.5,
          "desc": "Focaliseur divin."
        },
        {
          "name": "Sacoche de prêtre",
          "qty": 1,
          "weight": 12,
          "desc": "Matériel religieux et de voyage."
        }
      ],
      "kitGold": 9
    },
    "roublard": {
      "verified": true,
      "gold": 100,
      "kit": [
        {
          "name": "Armure de cuir",
          "qty": 1,
          "weight": 4.5,
          "desc": "CA 11 + Dextérité.",
          "armorId": "cuir"
        },
        {
          "name": "Dague",
          "qty": 2,
          "weight": 0.5,
          "desc": "Finesse, légère, lancer (6/18)."
        },
        {
          "name": "Épée courte",
          "qty": 1,
          "weight": 0.9,
          "desc": "Finesse, légère."
        },
        {
          "name": "Arc court",
          "qty": 1,
          "weight": 0.9,
          "desc": "Munitions, deux mains."
        },
        {
          "name": "Flèches",
          "qty": 20,
          "weight": 0.05,
          "desc": "Munitions pour arc."
        },
        {
          "name": "Carquois",
          "qty": 1,
          "weight": 0.5,
          "desc": "Contient les flèches."
        },
        {
          "name": "Outils de voleur",
          "qty": 1,
          "weight": 0.5,
          "desc": "Crochetage et désamorçage."
        },
        {
          "name": "Sacoche de cambrioleur",
          "qty": 1,
          "weight": 21,
          "desc": "Matériel d'infiltration."
        }
      ],
      "kitGold": 8
    },
    "ensorceleur": {
      "verified": true,
      "gold": 50,
      "kit": [
        {
          "name": "Lance",
          "qty": 1,
          "weight": 1.4,
          "desc": "Lancer (6/18), polyvalente."
        },
        {
          "name": "Dague",
          "qty": 2,
          "weight": 0.5,
          "desc": "Finesse, légère, lancer (6/18)."
        },
        {
          "name": "Cristal (focaliseur arcanique)",
          "qty": 1,
          "weight": 0.5,
          "desc": "Focaliseur pour les sorts."
        },
        {
          "name": "Sacoche d'exploration souterraine",
          "qty": 1,
          "weight": 27,
          "desc": "Matériel de donjon."
        }
      ],
      "kitGold": 28
    },
    "occultiste": {
      "verified": true,
      "gold": 100,
      "kit": [
        {
          "name": "Armure de cuir",
          "qty": 1,
          "weight": 4.5,
          "desc": "CA 11 + Dextérité.",
          "armorId": "cuir"
        },
        {
          "name": "Serpe",
          "qty": 1,
          "weight": 0.9,
          "desc": "Légère."
        },
        {
          "name": "Dague",
          "qty": 2,
          "weight": 0.5,
          "desc": "Finesse, légère, lancer (6/18)."
        },
        {
          "name": "Orbe (focaliseur arcanique)",
          "qty": 1,
          "weight": 1.4,
          "desc": "Focaliseur pour les sorts."
        },
        {
          "name": "Livre de savoir occulte",
          "qty": 1,
          "weight": 2.3,
          "desc": "Recueil de connaissances interdites."
        },
        {
          "name": "Sacoche d'érudit",
          "qty": 1,
          "weight": 5,
          "desc": "Livre, encre, plume, parchemin, sacoche."
        }
      ],
      "kitGold": 15
    },
    "magicien": {
      "verified": true,
      "gold": 55,
      "kit": [
        {
          "name": "Dague",
          "qty": 2,
          "weight": 0.5,
          "desc": "Finesse, légère, lancer (6/18)."
        },
        {
          "name": "Bâton de combat (focaliseur arcanique)",
          "qty": 1,
          "weight": 1.8,
          "desc": "Sert de focaliseur pour tes sorts."
        },
        {
          "name": "Robe",
          "qty": 1,
          "weight": 1.8,
          "desc": "Tenue de magicien."
        },
        {
          "name": "Grimoire",
          "qty": 1,
          "weight": 1.4,
          "desc": "Contient six sorts de niveau 1 de ton choix."
        },
        {
          "name": "Sacoche d'érudit",
          "qty": 1,
          "weight": 5,
          "desc": "Livre, encre, plume, parchemin, sacoche."
        }
      ],
      "kitGold": 5
    },
    "rodeur": {
      "verified": true,
      "gold": 150,
      "kit": [
        {
          "name": "Armure de cuir clouté",
          "qty": 1,
          "weight": 6,
          "desc": "CA 12 + Dextérité.",
          "armorId": "cuirclou"
        },
        {
          "name": "Cimeterre",
          "qty": 1,
          "weight": 1.4,
          "desc": "Finesse, légère."
        },
        {
          "name": "Épée courte",
          "qty": 1,
          "weight": 0.9,
          "desc": "Finesse, légère."
        },
        {
          "name": "Arc long",
          "qty": 1,
          "weight": 0.9,
          "desc": "Munitions (45/180), lourde, deux mains."
        },
        {
          "name": "Flèches",
          "qty": 20,
          "weight": 0.05,
          "desc": "Munitions pour arc."
        },
        {
          "name": "Carquois",
          "qty": 1,
          "weight": 0.5,
          "desc": "Contient jusqu'à 20 flèches."
        },
        {
          "name": "Focaliseur druidique",
          "qty": 1,
          "weight": 0.5,
          "desc": "Brin de gui."
        },
        {
          "name": "Sacoche d'explorateur",
          "qty": 1,
          "weight": 25,
          "desc": "Sac à dos, sac de couchage, gamelle, briquet, torches, rations, corde."
        }
      ],
      "kitGold": 7
    }
  };

/** Noms d'armes des kits qui ne correspondent pas directement à un id du catalogue. */
export const STARTING_WEAPON_ALIASES: Record<string, string> = {
    "Espadon": "epee2m",
    "Fléau": "fleau",
    "Grande hache": "grandehache"
  };

/** Objets fabricables avec chaque type d'outils (colonne « Craft » du Manuel). */
export const CRAFT_IDS_BY_TOOL: Record<string, unknown> = {
    "Matériel d'alchimiste": [
      "av-acide",
      "av-feu-gregeois",
      "av-sacoche-composantes",
      "av-huile",
      "av-papier",
      "av-parfum"
    ],
    "Matériel de brasseur": [
      "av-antitoxine"
    ],
    "Matériel de calligraphe": [
      "av-encre"
    ],
    "Outils de charpentier": [
      "av-tonneau",
      "av-coffre",
      "av-echelle",
      "av-perche",
      "av-belier",
      "av-torche"
    ],
    "Outils de cartographe": [
      "av-carte"
    ],
    "Outils de cordonnier": [
      "av-escalade"
    ],
    "Ustensiles de cuisinier": [
      "av-rations"
    ],
    "Outils de souffleur de verre": [
      "av-bouteille",
      "av-loupe",
      "av-longue-vue",
      "av-fiole"
    ],
    "Outils de joaillier": [
      "focus-cristal",
      "focus-orbe",
      "focus-baguette",
      "focus-baton",
      "focus-sceptre",
      "symbole-amulette",
      "symbole-embleme",
      "symbole-reliquaire"
    ],
    "Outils de tanneur": [
      "av-sac-dos",
      "av-etui-carreaux",
      "av-etui-cartes",
      "av-parchemin",
      "av-sacoche",
      "av-carquois",
      "av-outre"
    ],
    "Outils de maçon": [
      "av-palan"
    ],
    "Matériel de peintre": [
      "focus-gui",
      "focus-bois",
      "focus-if",
      "symbole-amulette",
      "symbole-embleme",
      "symbole-reliquaire"
    ],
    "Outils de potier": [
      "av-cruche",
      "av-lampe"
    ],
    "Outils de forgeron": [
      "av-billes",
      "av-seau",
      "av-chaussetrappes",
      "av-chaine",
      "av-pied-biche",
      "mun-balles-feu",
      "av-grappin",
      "av-marmite",
      "mun-billes-fronde",
      "av-pitons"
    ],
    "Outils de rétameur": [
      "av-clochette",
      "av-lanterne-faisceau",
      "av-flasque",
      "av-lanterne-capote",
      "av-piege-chasse",
      "av-cadenas",
      "av-menottes",
      "av-miroir",
      "av-pelle",
      "av-sifflet",
      "av-briquet"
    ],
    "Outils de tisserand": [
      "av-panier",
      "av-sac-couchage",
      "av-couverture",
      "av-tenue-luxe",
      "av-filet",
      "av-robe",
      "av-corde",
      "av-sac",
      "av-ficelle",
      "av-tente",
      "av-tenue-voyage"
    ],
    "Outils de sculpteur sur bois": [
      "focus-baguette",
      "focus-baton",
      "focus-bois",
      "focus-if",
      "mun-fleches",
      "mun-carreaux",
      "av-plume",
      "mun-aiguilles"
    ],
    "Nécessaire de déguisement": [
      "av-costume"
    ],
    "Nécessaire d'herboriste": [
      "av-antitoxine",
      "av-bougie",
      "av-trousse-soins",
      "av-potion-soins"
    ],
    "Nécessaire d'empoisonneur": [
      "av-poison"
    ]
  };

/** Objets fabricables rapidement, entre deux repos longs, avec le don Artisan. */
export const FAST_CRAFT_IDS_BY_TOOL: Record<string, unknown> = {
    "Outils de charpentier": [
      "av-echelle",
      "av-torche"
    ],
    "Outils de tanneur": [
      "av-etui-carreaux",
      "av-etui-cartes",
      "av-sacoche"
    ],
    "Outils de maçon": [
      "av-palan"
    ],
    "Outils de potier": [
      "av-cruche",
      "av-lampe"
    ],
    "Outils de forgeron": [
      "av-billes",
      "av-seau",
      "av-chaussetrappes",
      "av-grappin",
      "av-marmite"
    ],
    "Outils de rétameur": [
      "av-clochette",
      "av-pelle",
      "av-briquet"
    ],
    "Outils de tisserand": [
      "av-panier",
      "av-corde",
      "av-filet",
      "av-tente"
    ],
    "Outils de sculpteur sur bois": [
      "arme-gourdin",
      "arme-massue",
      "arme-baton"
    ]
  };

/** Outils ouvrant la fabrication rapide. */
export const FAST_CRAFT_TOOLS: string[] = [
    "Outils de charpentier",
    "Outils de tanneur",
    "Outils de maçon",
    "Outils de potier",
    "Outils de forgeron",
    "Outils de rétameur",
    "Outils de tisserand",
    "Outils de sculpteur sur bois"
  ];

/** Id de l'objet « outils » correspondant à chaque maîtrise d'outil. */
export const CRAFT_TOOL_ITEM_ID: Record<string, string> = {
    "Matériel d'alchimiste": "outil-alchimiste",
    "Matériel de brasseur": "outil-brasseur",
    "Matériel de calligraphe": "outil-calligraphe",
    "Outils de charpentier": "outil-charpentier",
    "Outils de cartographe": "outil-cartographe",
    "Outils de cordonnier": "outil-cordonnier",
    "Ustensiles de cuisinier": "outil-cuisinier",
    "Outils de souffleur de verre": "outil-souffleur",
    "Outils de joaillier": "outil-joaillier",
    "Outils de tanneur": "outil-tanneur",
    "Outils de maçon": "outil-macon",
    "Matériel de peintre": "outil-peintre",
    "Outils de potier": "outil-potier",
    "Outils de forgeron": "outil-forgeron",
    "Outils de rétameur": "outil-retameur",
    "Outils de tisserand": "outil-tisserand",
    "Outils de sculpteur sur bois": "outil-sculpteur",
    "Nécessaire de déguisement": "outil-deguisement",
    "Nécessaire d'herboriste": "outil-herboriste",
    "Nécessaire d'empoisonneur": "outil-empoisonneur"
  };
