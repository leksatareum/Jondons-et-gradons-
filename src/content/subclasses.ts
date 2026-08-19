/**
 * Sous-classes — PHB 2024, avec leurs capacités par niveau.
 *
 * ⚠️ Repêché de la SORTIE CONSTRUITE de `table-connectee/src/App.jsx`
 * (`SUBCLASSES`) : la chaîne de plugins réécrit cette table, le texte source
 * n'est pas fiable ici. Littéral évalué depuis la sortie construite puis
 * sérialisé, jamais recopié à la main.
 *
 * `src` indique le degré de vérification hérité de l'ancienne app
 * (`verifie` = relu contre le Manuel à l'époque). Les capacités portant des
 * champs mécaniques (`critRange`…) sont celles que le moteur peut appliquer
 * directement ; les autres sont du texte de rappel pour la table.
 *
 * Les ressources chiffrées consommées par ces capacités vivent dans les
 * modules `*-resources.ts` du domaine, pas ici.
 */

export interface SubclassFeature {
  level: number;
  name: string;
  desc: string;
  [key: string]: unknown;
}

export interface SubclassOption {
  id: string;
  name: string;
  desc: string;
  src?: string;
  features: SubclassFeature[];
  [key: string]: unknown;
}

export interface SubclassGroup {
  /** Niveau auquel la classe choisit sa sous-classe (3 pour toutes en 2024). */
  choiceLevel: number;
  /** Intitulé du choix, propre à chaque classe (« Archétype martial », « Cercle druidique »…). */
  label: string;
  options: SubclassOption[];
}

/** 48 sous-classes, groupées par classe. */
export const SUBCLASSES: Record<string, SubclassGroup> = {
    "guerrier": {
      "choiceLevel": 3,
      "label": "Archétype martial",
      "options": [
        {
          "id": "champion",
          "name": "Champion",
          "src": "verifie",
          "desc": "Le guerrier héroïque : critiques élargis, prouesses physiques et endurance exceptionnelle.",
          "features": [
            {
              "level": 3,
              "name": "Critique amélioré",
              "desc": "Tes attaques d'arme et à mains nues font un coup critique sur un 19 ou un 20.",
              "critRange": 19
            },
            {
              "level": 3,
              "name": "Athlète remarquable",
              "desc": "Avantage aux jets d'initiative et aux tests de Force (Athlétisme). Après un critique, tu te déplaces de la moitié de ta vitesse sans provoquer d'attaque d'opportunité."
            },
            {
              "level": 7,
              "name": "Style de combat supplémentaire",
              "desc": "Tu gagnes un second don de Style de combat de ton choix."
            },
            {
              "level": 10,
              "name": "Guerrier héroïque",
              "desc": "En combat, tu obtiens l'Inspiration héroïque au début de chacun de tes tours si tu ne l'as pas déjà."
            },
            {
              "level": 15,
              "name": "Critique supérieur",
              "desc": "Tes attaques font désormais un coup critique sur un 18, 19 ou 20.",
              "critRange": 18
            },
            {
              "level": 18,
              "name": "Survivant",
              "desc": "Avantage aux sauvegardes contre la mort, et un résultat de 18 à 20 compte comme une réussite critique."
            }
          ]
        },
        {
          "id": "maitre",
          "name": "Maître de guerre",
          "src": "verifie",
          "desc": "Un tacticien qui dépense des dés de manœuvre pour désarmer, riposter, menacer ou repositionner.",
          "features": [
            {
              "level": 3,
              "name": "Manœuvres de combat",
              "desc": "Tu apprends trois manœuvres et disposes de quatre dés de manœuvre (d8), récupérés au repos court ou long."
            },
            {
              "level": 3,
              "name": "Élève de la guerre",
              "desc": "Tu maîtrises un type d'outils d'artisan et une compétence supplémentaire de la liste du guerrier."
            },
            {
              "level": 7,
              "name": "Connaissez votre ennemi",
              "desc": "Action bonus : tu découvres les immunités, résistances et vulnérabilités d'une créature visible à 9 m. Une fois par repos long, ou en restaurant l'usage avec un dé de supériorité."
            },
            {
              "level": 10,
              "name": "Supériorité au combat améliorée",
              "desc": "Tes dés de supériorité deviennent des d10."
            },
            {
              "level": 15,
              "name": "Implacable",
              "desc": "Une fois par tour, tu peux utiliser 1d8 à la place de dépenser un dé de supériorité pour une manœuvre."
            },
            {
              "level": 18,
              "name": "Manœuvres suprêmes",
              "desc": "Tes dés de manœuvre passent au d12."
            }
          ]
        },
        {
          "id": "occulte",
          "name": "Chevalier occulte",
          "src": "verifie",
          "desc": "Un guerrier qui mêle magie de magicien et acier, avec une arme liée.",
          "features": [
            {
              "level": 3,
              "name": "Incantation",
              "desc": "Tu apprends des sorts de la liste du Magicien et les lances avec l'Intelligence, selon la table d'incantation du Chevalier occulte."
            },
            {
              "level": 3,
              "name": "Lien de guerre",
              "desc": "Tu lies jusqu'à deux armes : tu peux les rappeler à toi par une action bonus."
            },
            {
              "level": 7,
              "name": "Magie de guerre",
              "desc": "Quand tu entreprends l'action Attaquer, tu peux remplacer une attaque par un sort mineur de magicien dont l'incantation demande une action."
            },
            {
              "level": 10,
              "name": "Frappe occulte",
              "desc": "Une créature touchée par ton arme a le désavantage à sa prochaine sauvegarde contre un de tes sorts avant la fin de ton tour suivant."
            },
            {
              "level": 15,
              "name": "Charge arcanique",
              "desc": "Quand tu utilises Fougue guerrière, tu peux te téléporter de 9 m avant ou après l'action supplémentaire."
            },
            {
              "level": 18,
              "name": "Magie de guerre améliorée",
              "desc": "Dans l'action Attaquer, tu peux remplacer deux attaques par un sort de magicien de niveau 1 ou 2 dont l'incantation demande une action."
            }
          ]
        },
        {
          "id": "psi",
          "name": "Guerrier psi",
          "src": "verifie",
          "desc": "Une force mentale : bouclier psychique, frappe psionique et déplacements télékinétiques.",
          "features": [
            {
              "level": 3,
              "name": "Puissance psionique",
              "desc": "Tu disposes de dés d'énergie psionique servant à renforcer tes coups, protéger un allié ou déplacer un objet."
            },
            {
              "level": 7,
              "name": "Adepte télékinétique",
              "desc": "Un bond psychique te donne brièvement une vitesse de vol ; ta Frappe psionique peut aussi renverser ou déplacer sa cible."
            },
            {
              "level": 10,
              "name": "Esprit gardé",
              "desc": "Résistance aux dégâts psychiques ; dépense un dé psionique au début de ton tour pour mettre fin aux effets qui te charment ou t'effraient."
            },
            {
              "level": 15,
              "name": "Rempart de force",
              "desc": "Action bonus : toi et plusieurs créatures proches obtenez un demi-couvert pendant 1 minute."
            },
            {
              "level": 18,
              "name": "Maître télékinétique",
              "desc": "Télékinésie toujours préparée et lançable sans emplacement ni composante ; pendant la concentration, tu peux attaquer par action bonus."
            }
          ]
        }
      ]
    },
    "rodeur": {
      "choiceLevel": 3,
      "label": "Archétype de rôdeur",
      "options": [
        {
          "id": "chasseur",
          "name": "Chasseur",
          "src": "verifie",
          "desc": "Le tacticien : des options de dégâts et de défense que tu réajustes à chaque repos.",
          "features": [
            {
              "level": 3,
              "name": "Savoir du chasseur",
              "desc": "Tant qu'une créature porte ta Marque du chasseur, tu connais ses immunités, résistances et vulnérabilités aux dégâts."
            },
            {
              "level": 3,
              "name": "Proie du chasseur",
              "desc": "Choisis une option, modifiable à chaque repos court ou long. Tueur de colosses : +1d8 dégâts une fois par tour contre une créature déjà blessée. Briseur de horde : quand tu attaques, une seconde attaque contre une créature différente à 1,50 m de la première."
            },
            {
              "level": 7,
              "name": "Tactique défensive",
              "desc": "Choisis une option, modifiable à chaque repos court ou long. Échapper à la horde : les attaques d'opportunité contre toi ont le désavantage. Défense contre les attaques multiples : après qu'une créature t'a touché avec un jet d'attaque, cette créature a le désavantage à tous ses autres jets d'attaque contre toi pendant ce tour."
            },
            {
              "level": 11,
              "name": "Proie du chasseur supérieure",
              "desc": "Une fois par tour, quand tu infliges des dégâts à une créature marquée par Marque du chasseur, tu peux aussi infliger les dégâts supplémentaires du sort à une autre créature visible située à 9 m ou moins de la première."
            },
            {
              "level": 15,
              "name": "Défense supérieure",
              "desc": "Quand tu subis des dégâts, ta réaction peut te donner la résistance à ces dégâts et à tous les autres dégâts du même type jusqu'à la fin du tour en cours. Cette capacité n'a pas de compteur d'utilisations."
            }
          ]
        },
        {
          "id": "bestial",
          "name": "Maître des bêtes",
          "src": "verifie",
          "desc": "Une bête primordiale liée à toi, qui monte en puissance avec ton niveau.",
          "features": [
            {
              "level": 3,
              "name": "Compagnon primordial",
              "desc": "Tu invoques une bête primordiale et choisis son bloc : Bête terrestre, Bête marine ou Bête volante. Elle est amicale et agit pendant ton tour. Sans ordre, elle Esquive ; une action bonus lui ordonne une action, ou tu peux renoncer à une de tes attaques pour lui ordonner Frappe de la bête. Après un repos long, tu peux choisir une autre bête ; une bête morte depuis moins d’une heure peut être rappelée avec un emplacement de sort."
            },
            {
              "level": 7,
              "name": "Entraînement exceptionnel",
              "desc": "Quand ton action bonus commande la bête, elle peut aussi utiliser son action bonus pour Foncer, Se désengager, Esquiver ou Aider. Quand elle inflige des dégâts avec une attaque, ceux-ci peuvent devenir de Force au lieu de leur type normal."
            },
            {
              "level": 11,
              "name": "Furie bestiale",
              "desc": "Quand tu ordonnes Frappe de la bête, le compagnon l’utilise deux fois. La première fois à chaque tour qu’il touche la cible de ta Marque du chasseur, il inflige aussi des dégâts de Force égaux aux dégâts bonus de la marque."
            },
            {
              "level": 15,
              "name": "Partage des sorts",
              "desc": "Quand tu lances un sort qui te cible toi-même, tu peux aussi en faire bénéficier ta bête primordiale si elle se trouve à 9 m ou moins de toi."
            }
          ]
        },
        {
          "id": "feerique",
          "name": "Vagabond féerique",
          "src": "verifie",
          "desc": "Un charme d'outre-monde : dégâts psychiques, présence irrésistible, téléportations d'équipe.",
          "features": [
            {
              "level": 3,
              "name": "Frappes redoutables et Charme d'outre-monde",
              "desc": "Une fois par tour et par cible, quand tu touches une créature avec une arme, tu peux lui infliger 1d4 dégâts psychiques supplémentaires (1d6 au niveau 11). De plus, tu ajoutes ton modificateur de Sagesse (minimum +1) à tous tes tests de Charisme et tu gagnes la maîtrise de Tromperie, Représentation ou Persuasion."
            },
            {
              "level": 3,
              "name": "Sorts du vagabond",
              "desc": "Toujours préparés selon ton niveau de rôdeur : Charme-personne (3), Pas brumeux (5), Invocation d'une fée (9), Porte dimensionnelle (13) et Double illusoire (17)."
            },
            {
              "level": 7,
              "name": "Torsion enjôleuse",
              "desc": "Tu as l'avantage aux sauvegardes pour éviter ou terminer les états Charmé et Effrayé. Quand toi ou une créature visible à 36 m réussissez une sauvegarde pour éviter ou terminer l'un de ces états, ta réaction peut forcer une autre créature visible à 36 m à faire une sauvegarde de Sagesse ; en cas d'échec, tu la rends Charmée ou Effrayée pendant 1 minute. Elle refait la sauvegarde à la fin de chacun de ses tours."
            },
            {
              "level": 11,
              "name": "Renforts féeriques",
              "desc": "Tu peux lancer Invocation d'une fée sans sa composante matérielle et une fois sans dépenser d'emplacement, utilisation récupérée au repos long. À chaque lancement, tu peux choisir de retirer la concentration ; dans ce cas, la durée devient 1 minute."
            },
            {
              "level": 15,
              "name": "Vagabond brumeux",
              "desc": "Tu peux lancer Pas brumeux sans emplacement un nombre de fois égal à ton modificateur de Sagesse (minimum 1), récupérées au repos long. Chaque fois que tu le lances, tu peux emmener une créature consentante visible à 1,50 m ; elle apparaît dans un espace libre de ton choix à 1,50 m ou moins de ta destination."
            }
          ]
        },
        {
          "id": "tenebres",
          "name": "Traqueur des ténèbres",
          "src": "verifie",
          "desc": "L'embuscade du premier round : initiative, vision supérieure, frappe psychique.",
          "features": [
            {
              "level": 3,
              "name": "Embuscade redoutable",
              "desc": "Au début de ton premier tour de chaque combat, ta vitesse augmente de 3 m jusqu'à la fin de ce tour. Une fois par tour quand tu touches avec une arme, tu peux infliger 2d6 dégâts psychiques supplémentaires ; utilisations égales à ton modificateur de Sagesse (minimum 1) par repos long. Tu ajoutes aussi ton modificateur de Sagesse à l'initiative."
            },
            {
              "level": 3,
              "name": "Vision ombrale",
              "desc": "Tu gagnes Vision dans le noir à 18 m ; si tu la possèdes déjà, sa portée augmente de 18 m. Tant que tu es entièrement dans les ténèbres, tu es Invisible pour toute créature qui dépend de sa Vision dans le noir pour te voir dans ces ténèbres."
            },
            {
              "level": 3,
              "name": "Sorts du traqueur des ténèbres",
              "desc": "Toujours préparés selon ton niveau de Rôdeur : Déguisement (3), Corde enchantée (5), Terreur (9), Invisibilité supérieure (13) et Apparence trompeuse (17)."
            },
            {
              "level": 7,
              "name": "Esprit de fer",
              "desc": "Tu gagnes la maîtrise des sauvegardes de Sagesse. Si tu la possèdes déjà, prends Intelligence ou Charisme à la place."
            },
            {
              "level": 11,
              "name": "Rafale du traqueur",
              "desc": "Les dégâts psychiques de Frappe redoutable deviennent 2d8. Quand tu utilises cette frappe, choisis un effet : Frappe soudaine, une attaque supplémentaire avec la même arme contre une autre créature située à 1,50 m de la cible initiale et à portée ; ou Peur de masse, la cible et chaque créature à 3 m font une sauvegarde de Sagesse contre ton DD de sort ou sont Effrayées jusqu'au début de ton prochain tour."
            },
            {
              "level": 15,
              "name": "Esquive ombreuse",
              "desc": "Quand une créature fait un jet d'attaque contre toi, tu peux utiliser ta Réaction pour lui imposer un désavantage. Que l'attaque touche ou rate, tu peux ensuite te téléporter jusqu'à 9 m vers un espace libre visible."
            }
          ]
        }
      ]
    },
    "magicien": {
      "choiceLevel": 3,
      "label": "École de magie",
      "options": [
        {
          "id": "evocateur",
          "name": "Évocateur",
          "src": "verifie",
          "desc": "Le spécialiste des effets élémentaires explosifs, capable d'assurer des dégâts fiables et de préserver ses alliés.",
          "features": [
            {
              "level": 3,
              "name": "Savant en évocation",
              "desc": "Ajoute gratuitement au grimoire deux sorts d'Évocation de magicien de niveau 1 ou 2, puis un sort d'Évocation gratuit chaque fois que cette classe accède à un nouveau niveau d'emplacements."
            },
            {
              "level": 3,
              "name": "Sort mineur puissant",
              "desc": "Quand ton sort mineur infligeant des dégâts rate son attaque ou que la cible réussit sa sauvegarde, elle subit tout de même la moitié des dégâts, sans effet additionnel."
            },
            {
              "level": 6,
              "name": "Sculpteur de sorts",
              "desc": "Quand une Évocation affecte d'autres créatures visibles, protège-en jusqu'à 1 + le niveau du sort : sauvegarde automatique et aucun dégât lorsqu'une réussite en infligerait la moitié."
            },
            {
              "level": 10,
              "name": "Évocation renforcée",
              "desc": "Ajoute ton modificateur d'Intelligence à un jet de dégâts de chaque sort d'Évocation de magicien que tu lances."
            },
            {
              "level": 14,
              "name": "Surcharge",
              "desc": "À l'incantation d'un sort de magicien de niveau 1 à 5 infligeant des dégâts, maximise ses dégâts ce tour-ci. Après le premier usage par repos long, tu subis des dégâts nécrotiques croissants qui ignorent résistance et immunité."
            }
          ]
        },
        {
          "id": "abjurateur",
          "name": "Abjurateur",
          "src": "verifie",
          "desc": "Le protecteur qui bannit les influences hostiles et interpose une défense arcanique entre le danger et son groupe.",
          "features": [
            {
              "level": 3,
              "name": "Savant en abjuration",
              "desc": "Ajoute gratuitement au grimoire deux sorts d'Abjuration de magicien de niveau 1 ou 2, puis un sort d'Abjuration gratuit à chaque nouveau niveau d'emplacements obtenu dans cette classe."
            },
            {
              "level": 3,
              "name": "Protection arcanique",
              "desc": "La première Abjuration lancée avec un emplacement après un repos long crée une protection de 2 × ton niveau de magicien + Intelligence PV. Elle absorbe les dégâts après résistances et vulnérabilités et récupère 2 PV par niveau d'emplacement d'Abjuration ; une action bonus permet aussi de dépenser un emplacement pour la restaurer."
            },
            {
              "level": 6,
              "name": "Protection projetée",
              "desc": "Réaction lorsqu'une créature visible à 9 m subit des dégâts : ta Protection arcanique les absorbe à sa place, après les résistances et vulnérabilités de la créature."
            },
            {
              "level": 10,
              "name": "Briseur de sorts",
              "desc": "Contresort et Dissipation de la magie sont toujours préparés. Dissipation devient une action bonus et ajoute la maîtrise à son test ; si l'un de ces sorts échoue à arrêter un sort, son emplacement n'est pas dépensé."
            },
            {
              "level": 14,
              "name": "Résistance aux sorts",
              "desc": "Avantage aux sauvegardes contre les sorts et résistance aux dégâts infligés par les sorts."
            }
          ]
        },
        {
          "id": "devin",
          "name": "Devin",
          "src": "verifie",
          "desc": "Le lecteur du passé, du présent et des futurs possibles, capable de substituer ses prédictions aux tests de d20.",
          "features": [
            {
              "level": 3,
              "name": "Savant en divination",
              "desc": "Ajoute gratuitement au grimoire deux sorts de Divination de magicien de niveau 1 ou 2, puis un sort de Divination gratuit à chaque nouveau niveau d'emplacements obtenu dans cette classe."
            },
            {
              "level": 3,
              "name": "Présage",
              "desc": "Après chaque repos long, consigne deux résultats de d20. Avant qu'il soit lancé, remplace un test de d20 visible par l'un d'eux, au plus une fois par tour ; chaque résultat ne sert qu'une fois."
            },
            {
              "level": 6,
              "name": "Divination experte",
              "desc": "Après avoir lancé une Divination avec un emplacement de niveau 2+, récupère un emplacement dépensé d'un niveau inférieur, au maximum de niveau 5."
            },
            {
              "level": 10,
              "name": "Troisième Œil",
              "desc": "Action bonus, une fois par repos court ou long : jusqu'au prochain repos, choisis vision dans le noir à 36 m, lecture de toute langue ou lancement de Vision de l'invisible sans emplacement."
            },
            {
              "level": 14,
              "name": "Présage supérieur",
              "desc": "Après le repos long, lance et conserve trois d20 au lieu de deux pour Présage."
            }
          ]
        },
        {
          "id": "illusionniste",
          "name": "Illusionniste",
          "src": "verifie",
          "desc": "Le trompeur des sens qui étend, accélère et rend parfois tangible une magie d'apparences.",
          "features": [
            {
              "level": 3,
              "name": "Savant en illusion",
              "desc": "Ajoute gratuitement au grimoire deux sorts d'Illusion de magicien de niveau 1 ou 2, puis un sort d'Illusion gratuit à chaque nouveau niveau d'emplacements obtenu dans cette classe."
            },
            {
              "level": 3,
              "name": "Illusions améliorées",
              "desc": "Tes Illusions n'exigent pas de composante verbale et gagnent 18 m de portée lorsqu'elles en ont au moins 3 m. Tu connais Illusion mineure en supplément, la lances par action bonus et peux y mêler son et image."
            },
            {
              "level": 6,
              "name": "Créatures fantasmatiques",
              "desc": "Invocation d'une bête et Invocation d'une fée sont toujours préparés et peuvent devenir des Illusions. Une fois chacune par repos long, lance leur version illusoire sans emplacement ; la créature apparaît avec la moitié de ses PV."
            },
            {
              "level": 10,
              "name": "Double illusoire",
              "desc": "Réaction après avoir été touché : l'attaque rate automatiquement. L'usage revient au repos court ou long, ou en dépensant un emplacement de niveau 2+ sans action."
            },
            {
              "level": 14,
              "name": "Réalité illusoire",
              "desc": "Quand tu lances une Illusion avec emplacement, rends réel pendant 1 minute un objet inanimé et non magique de l'illusion. Il ne peut infliger de dégâts ni imposer d'état."
            }
          ]
        }
      ]
    },
    "barbare": {
      "choiceLevel": 3,
      "label": "Voie primitive",
      "options": [
        {
          "id": "berserker",
          "name": "Voie du Berserker",
          "src": "verifie",
          "desc": "La rage à l'état brut : frénésie, esprit inébranlable, riposte et terreur.",
          "features": [
            {
              "level": 3,
              "name": "Frénésie",
              "desc": "Sous Rage, si tu emploies Attaque téméraire, la première cible touchée à ton tour par une attaque basée sur la Force subit un nombre de d6 supplémentaires égal à ton bonus de dégâts de Rage."
            },
            {
              "level": 6,
              "name": "Rage irréfléchie",
              "desc": "Pendant ta Rage, tu es immunisé aux états Charmé et Effrayé ; les états déjà présents prennent fin quand tu entres en Rage."
            },
            {
              "level": 10,
              "name": "Représailles",
              "desc": "Quand une créature à 1,50 m te blesse, ta réaction te permet de l'attaquer au corps à corps avec une arme ou une frappe à mains nues."
            },
            {
              "level": 14,
              "name": "Présence intimidante",
              "desc": "Action bonus : les créatures choisies dans une émanation de 9 m font une sauvegarde de Sagesse ou sont Effrayées pendant 1 minute. Une utilisation par repos long, restaurable en dépensant une Rage."
            }
          ]
        },
        {
          "id": "coeur",
          "name": "Voie du Cœur sauvage",
          "src": "verifie",
          "desc": "Une communion animale : rituels, aspects adaptables et puissance bestiale.",
          "features": [
            {
              "level": 3,
              "name": "Orateur animal",
              "desc": "Tu peux lancer Sens animal et Communication avec les animaux uniquement comme rituels, avec la Sagesse."
            },
            {
              "level": 3,
              "name": "Rage des terres sauvages",
              "desc": "À chaque Rage, choisis Ours (résistances étendues), Aigle (Foncer et Se désengager) ou Loup (avantage des alliés contre les ennemis proches)."
            },
            {
              "level": 6,
              "name": "Aspect des terres sauvages",
              "desc": "Après chaque repos long, choisis Hibou (vision dans le noir accrue), Panthère (vitesse d'escalade) ou Saumon (vitesse de nage)."
            },
            {
              "level": 10,
              "name": "Orateur de la nature",
              "desc": "Tu peux lancer Communion avec la nature uniquement comme rituel, avec la Sagesse."
            },
            {
              "level": 14,
              "name": "Puissance des terres sauvages",
              "desc": "À chaque Rage, choisis Faucon (vol sans armure), Lion (protection des alliés proches) ou Bélier (mettre À terre une cible G ou plus petite touchée au corps à corps)."
            }
          ]
        },
        {
          "id": "arbre",
          "name": "Voie de l'Arbre-monde",
          "src": "verifie",
          "desc": "Ancrage dans l'arbre cosmique : vitalité partagée, branches spatiales et téléportation.",
          "features": [
            {
              "level": 3,
              "name": "Vitalité de l'Arbre-monde",
              "desc": "Entrer en Rage te donne des PV temporaires égaux à ton niveau de barbare ; au début de chacun de tes tours de Rage, un allié à 3 m reçoit des d6 temporaires selon ton bonus de dégâts de Rage."
            },
            {
              "level": 6,
              "name": "Branches de l'Arbre-monde",
              "desc": "Réaction quand une créature visible commence son tour à 9 m : sauvegarde de Force ou téléportation près de toi, puis sa vitesse peut tomber à 0 pour ce tour."
            },
            {
              "level": 10,
              "name": "Racines fracassantes",
              "desc": "À ton tour, les armes de corps à corps Lourdes ou Polyvalentes gagnent 3 m d'allonge et peuvent appliquer Repoussement ou Renversement en plus de leur autre maîtrise."
            },
            {
              "level": 14,
              "name": "Voyage dans l'Arbre",
              "desc": "À l'entrée en Rage puis par action bonus, téléporte-toi de 18 m. Une fois par Rage, la portée passe à 45 m et tu peux emmener jusqu'à six alliés proches."
            }
          ]
        },
        {
          "id": "zele",
          "name": "Voie du Zélateur",
          "src": "verifie",
          "desc": "Fureur divine : dégâts sacrés, réserve de guérison, sauvegardes obstinées et avatar divin.",
          "features": [
            {
              "level": 3,
              "name": "Fureur divine",
              "desc": "À chaque tour de Rage, ta première attaque d'arme ou frappe à mains nues touchée inflige 1d6 + la moitié de ton niveau de barbare en dégâts nécrotiques ou radiants."
            },
            {
              "level": 3,
              "name": "Guerrier des dieux",
              "desc": "Action bonus : dépense des d12 d'une réserve de quatre dés pour te soigner. Elle passe à cinq dés au niveau 6, six au 12 et sept au 17, et revient au repos long."
            },
            {
              "level": 6,
              "name": "Concentration fanatique",
              "desc": "Une fois par Rage, après une sauvegarde ratée, relance-la avec un bonus égal à ton bonus de dégâts de Rage et garde le nouveau résultat."
            },
            {
              "level": 10,
              "name": "Présence zélée",
              "desc": "Action bonus : jusqu'à dix alliés à 18 m ont l'avantage aux attaques et sauvegardes jusqu'à ton prochain tour. Une utilisation par repos long, restaurable en dépensant une Rage."
            },
            {
              "level": 14,
              "name": "Rage des dieux",
              "desc": "Quand tu entres en Rage, adopte une forme divine pendant 1 minute : vol stationnaire et résistances nécrotique, psychique et radiante ; ta réaction et une Rage peuvent empêcher un allié proche de tomber à 0 PV. Une fois par repos long."
            }
          ]
        }
      ]
    },
    "roublard": {
      "choiceLevel": 3,
      "label": "Archétype de roublard",
      "options": [
        {
          "id": "voleur",
          "name": "Voleur",
          "src": "verifie",
          "desc": "Le cambrioleur et chasseur de trésors classique, agile et capable d'exploiter les objets magiques mieux que quiconque.",
          "features": [
            {
              "level": 3,
              "name": "Mains rapides",
              "desc": "Action bonus : test d'Escamotage pour crocheter, désamorcer ou faire les poches ; action Utiliser ; ou action Magie d'un objet magique."
            },
            {
              "level": 3,
              "name": "Travail en hauteur",
              "desc": "Vitesse d'escalade égale à ta vitesse et calcul des distances de saut avec la Dextérité plutôt que la Force."
            },
            {
              "level": 9,
              "name": "Furtivité suprême",
              "desc": "Nouvelle Frappe rusée, coût 1d6 : si l'attaque part de l'état Invisible obtenu en se cachant, cet état persiste si tu termines le tour derrière un couvert aux trois quarts ou total."
            },
            {
              "level": 13,
              "name": "Utilisation d'objets magiques",
              "desc": "Harmonisation avec quatre objets ; sur un 6 au d6, une propriété ne dépense pas sa charge ; utilisation de tout parchemin avec Intelligence, avec test d'Arcanes DD 10 + niveau au-delà du niveau 1."
            },
            {
              "level": 17,
              "name": "Réflexes de voleur",
              "desc": "Au premier round de chaque combat, tu joues une seconde fois à ton initiative moins 10."
            }
          ]
        },
        {
          "id": "assassin",
          "name": "Assassin",
          "src": "verifie",
          "desc": "Le spécialiste de l'embuscade, du poison et du déguisement, létal avant que l'adversaire puisse agir.",
          "features": [
            {
              "level": 3,
              "name": "Assassinat",
              "desc": "Avantage à l'initiative. Au premier round, avantage aux attaques contre les créatures n'ayant pas encore joué ; si l'Attaque sournoise touche ce round, ajoute ton niveau de roublard aux dégâts de l'arme."
            },
            {
              "level": 3,
              "name": "Outils d'assassin",
              "desc": "Tu reçois et maîtrises un nécessaire de déguisement et un nécessaire d'empoisonneur."
            },
            {
              "level": 9,
              "name": "Expertise d'infiltration",
              "desc": "Après une heure d'étude, imite parfaitement la parole, l'écriture ou les deux d'une personne. Viser avec soin ne réduit plus ta vitesse à 0."
            },
            {
              "level": 13,
              "name": "Armes empoisonnées",
              "desc": "Avec l'option Poison de Frappe rusée, un échec de sauvegarde inflige aussi 2d6 poison, en ignorant la résistance au poison."
            },
            {
              "level": 17,
              "name": "Frappe mortelle",
              "desc": "Quand ton Attaque sournoise touche au premier round, sauvegarde de Constitution DD 8 + Dextérité + maîtrise ou double tous les dégâts de l'attaque."
            }
          ]
        },
        {
          "id": "arcane",
          "name": "Filou arcanique",
          "src": "verifie",
          "desc": "Le roublard qui mêle magie de magicien, discrétion et une Main du mage particulièrement adroite.",
          "features": [
            {
              "level": 3,
              "name": "Incantation",
              "desc": "Tu apprends des sorts de la liste du Magicien et les lances avec l'Intelligence, selon la table d'incantation du Filou arcanique."
            },
            {
              "level": 3,
              "name": "Escamotage de Main du mage",
              "desc": "Main du mage devient une action bonus, peut être invisible, se contrôle par action bonus et peut effectuer tes tests d'Escamotage."
            },
            {
              "level": 9,
              "name": "Embuscade magique",
              "desc": "Si tu es Invisible quand tu lances un sort sur une créature, elle a le désavantage à ses sauvegardes contre ce sort pendant ce tour."
            },
            {
              "level": 13,
              "name": "Filou polyvalent",
              "desc": "Quand l'option Renversement de Frappe rusée vise une créature, applique-la aussi à une seconde créature à 1,50 m de ta Main du mage."
            },
            {
              "level": 17,
              "name": "Voleur de sorts",
              "desc": "Réaction après un sort qui te cible ou t'inclut : sauvegarde d'Intelligence contre ton DD. Sur échec, annule pour toi et prépare le sort pendant 8 h s'il est lançable ; le lanceur ne peut plus le lancer. Une fois par repos long."
            }
          ]
        },
        {
          "id": "ame",
          "name": "Lame d'âme",
          "src": "verifie",
          "desc": "Le psionique qui communique par la pensée, renforce ses talents et frappe avec des lames mentales sans trace.",
          "features": [
            {
              "level": 3,
              "name": "Puissance psionique",
              "desc": "Réserve de dés d'énergie psionique : renforce un test maîtrisé raté sans dépenser le dé si l'échec demeure ; ou crée un réseau télépathique d'une durée en heures égale au résultat, gratuit une fois par repos long. Un dé revient au repos court, tous au long."
            },
            {
              "level": 3,
              "name": "Lames psychiques",
              "desc": "Dans Attaquer ou une attaque d'opportunité, crée une arme simple de finesse lancée à 18/36 m, 1d6 psychique, maîtrise Harcèlement. Après l'attaque, une seconde lame à 1d4 peut frapper par action bonus si l'autre main est libre."
            },
            {
              "level": 9,
              "name": "Lames de l'âme",
              "desc": "Après avoir raté avec une lame, ajoute un dé psionique et ne le dépense que si l'attaque touche. Action bonus : lance une lame et dépense un dé pour te téléporter de 3 m × le résultat."
            },
            {
              "level": 13,
              "name": "Voile psychique",
              "desc": "Action Magie : Invisible pendant 1 heure, jusqu'à infliger des dégâts ou imposer une sauvegarde. Une fois par repos long, restaurable en dépensant un dé psionique."
            },
            {
              "level": 17,
              "name": "Déchirer l'esprit",
              "desc": "Après des dégâts d'Attaque sournoise avec une lame, sauvegarde de Sagesse DD 8 + Dextérité + maîtrise ou Étourdi pendant 1 minute, nouvelle sauvegarde à chaque fin de tour. Une fois par repos long, restaurable avec trois dés psioniques."
            }
          ]
        }
      ]
    },
    "clerc": {
      "choiceLevel": 3,
      "label": "Domaine divin",
      "options": [
        {
          "id": "vie",
          "name": "Domaine de la Vie",
          "src": "verifie",
          "desc": "Le maître de l'énergie positive, dont les sorts et la canalisation soutiennent les créatures les plus blessées.",
          "features": [
            {
              "level": 3,
              "name": "Disciple de la vie",
              "desc": "Quand un sort avec emplacement rend des PV, ajoute 2 + niveau de l'emplacement au soin d'une créature pendant le tour de l'incantation."
            },
            {
              "level": 3,
              "name": "Sorts du domaine de la Vie",
              "desc": "Quatre sorts sont toujours préparés au niveau 3, puis deux supplémentaires aux niveaux 5, 7 et 9."
            },
            {
              "level": 3,
              "name": "Préservation de la vie",
              "desc": "Action Magie et Conduit divin : répartis cinq fois ton niveau de clerc PV entre les créatures Ensanglantées à 9 m, sans dépasser la moitié de leur maximum."
            },
            {
              "level": 6,
              "name": "Guérisseur béni",
              "desc": "Juste après qu'un sort avec emplacement soigne au moins une autre créature, récupère 2 + niveau de l'emplacement PV."
            },
            {
              "level": 17,
              "name": "Guérison suprême",
              "desc": "Pour les soins d'un sort ou d'un Conduit divin, chaque dé utilise automatiquement sa valeur maximale."
            }
          ]
        },
        {
          "id": "lumiere",
          "name": "Domaine de la Lumière",
          "src": "verifie",
          "desc": "Le porteur de feu et de révélation, qui aveugle les assaillants et expose ses ennemis à la lumière solaire.",
          "features": [
            {
              "level": 3,
              "name": "Sorts du domaine de la Lumière",
              "desc": "Quatre sorts sont toujours préparés au niveau 3, puis deux supplémentaires aux niveaux 5, 7 et 9."
            },
            {
              "level": 3,
              "name": "Éclat de l'aube",
              "desc": "Action Magie et Conduit divin : dissipe les ténèbres magiques dans une émanation de 9 m ; les créatures choisies y font une sauvegarde de Constitution, 2d10 + niveau de clerc radiants, moitié en cas de réussite."
            },
            {
              "level": 3,
              "name": "Éclat protecteur",
              "desc": "Réaction à une attaque d'une créature visible à 9 m : impose le désavantage. Utilisations égales à Sagesse par repos long."
            },
            {
              "level": 6,
              "name": "Éclat protecteur amélioré",
              "desc": "Les usages reviennent aussi au repos court. Quand tu l'utilises, la cible de l'attaque gagne 2d6 + Sagesse PV temporaires."
            },
            {
              "level": 17,
              "name": "Couronne de lumière",
              "desc": "Action Magie, une minute : lumière vive solaire à 18 m puis faible à 9 m ; tes ennemis dans la lumière vive ont le désavantage aux sauvegardes contre Éclat de l'aube et tes sorts de feu ou radiants. Utilisations égales à Sagesse par repos long."
            }
          ]
        },
        {
          "id": "duperie",
          "name": "Domaine de la Duperie",
          "src": "verifie",
          "desc": "Le perturbateur divin de l'illusion, de la furtivité et du changement de place avec son propre double.",
          "features": [
            {
              "level": 3,
              "name": "Bénédiction du filou",
              "desc": "Action Magie : toi ou une créature consentante à 9 m gagne l'avantage en Discrétion jusqu'à ton prochain repos long ou un nouvel usage."
            },
            {
              "level": 3,
              "name": "Invocation de duplicité",
              "desc": "Action bonus et Conduit divin : double visuel intangible pendant 1 minute à 9 m. Lance tes sorts depuis sa position, gagne l'avantage contre une cible adjacente au double si tu l'es aussi, et déplace-le de 9 m par action bonus dans un rayon de 36 m."
            },
            {
              "level": 3,
              "name": "Sorts du domaine de la Duperie",
              "desc": "Quatre sorts sont toujours préparés au niveau 3, puis deux supplémentaires aux niveaux 5, 7 et 9."
            },
            {
              "level": 6,
              "name": "Transposition du filou",
              "desc": "Quand ton action bonus crée ou déplace le double, échange ta place avec lui par téléportation."
            },
            {
              "level": 17,
              "name": "Duplicité améliorée",
              "desc": "Tes alliés gagnent aussi l'avantage contre une cible à 1,50 m du double. À la fin du double, toi ou une créature à 1,50 m récupère ton niveau de clerc PV."
            }
          ]
        },
        {
          "id": "guerre",
          "name": "Domaine de la Guerre",
          "src": "verifie",
          "desc": "Le prêtre de bataille qui transforme sa canalisation en précision, attaques bonus et magie sans concentration.",
          "features": [
            {
              "level": 3,
              "name": "Frappe guidée",
              "desc": "Après qu'une attaque à 9 m rate, dépense un Conduit divin pour lui donner +10 et potentiellement toucher ; si l'attaque est celle d'autrui, cela utilise ta réaction."
            },
            {
              "level": 3,
              "name": "Sorts du domaine de la Guerre",
              "desc": "Quatre sorts sont toujours préparés au niveau 3, puis deux supplémentaires aux niveaux 5, 7 et 9."
            },
            {
              "level": 3,
              "name": "Prêtre de guerre",
              "desc": "Action bonus : une attaque d'arme ou frappe à mains nues. Utilisations égales à Sagesse par repos court ou long."
            },
            {
              "level": 6,
              "name": "Bénédiction du dieu de la guerre",
              "desc": "Dépense un Conduit divin pour lancer Bouclier de la foi ou Arme spirituelle sans emplacement ni concentration ; durée 1 minute, interrompue par une nouvelle incantation, Incapacité ou mort."
            },
            {
              "level": 17,
              "name": "Avatar de bataille",
              "desc": "Résistance à tous les dégâts contondants, perforants et tranchants, sans restriction d'origine magique."
            }
          ]
        }
      ]
    },
    "druide": {
      "choiceLevel": 3,
      "label": "Cercle druidique",
      "options": [
        {
          "id": "terre",
          "name": "Cercle de la Terre",
          "src": "verifie",
          "desc": "Le lanceur polyvalent : des sorts liés au terrain, et une zone qui blesse et soigne d'un même geste.",
          "features": [
            {
              "level": 3,
              "name": "Sorts du cercle",
              "desc": "Après chaque repos long, choisis un type de terre — aride, polaire, tempérée ou tropicale. Tu as en permanence préparés un sort mineur et les sorts correspondants, qui ne comptent pas dans ton quota."
            },
            {
              "level": 3,
              "name": "Aide de la terre",
              "desc": "Action de Magie : tu dépenses une utilisation de Forme sauvage et vises un point à 18 m. Dans une sphère de 3 m de rayon, tu choisis les créatures touchées — alliées ou non : chacune fait une sauvegarde de Constitution contre ton DD et subit 2d6 dégâts nécrotiques, moitié en cas de réussite. Une créature de ton choix dans la sphère récupère le même nombre de d6 en points de vie. Les dés passent à 3d6 au niveau 10 et 4d6 au niveau 14."
            },
            {
              "level": 6,
              "name": "Récupération naturelle",
              "desc": "Deux effets indépendants. Une fois par repos long, tu lances sans emplacement un sort de niveau 1 ou plus actuellement préparé grâce aux Sorts du cercle. Et une fois par repos long, après un repos court, tu récupères des emplacements dont la somme des niveaux ne dépasse pas la moitié de ton niveau de druide arrondie au supérieur, aucun de niveau 6 ou plus."
            },
            {
              "level": 10,
              "name": "Garde de la nature",
              "desc": "Tu es immunisé à l'état Empoisonné, et tu obtiens une résistance liée à ta terre choisie : feu en aride, froid en polaire, foudre en tempérée, poison en tropicale."
            },
            {
              "level": 14,
              "name": "Sanctuaire de la nature",
              "desc": "Action de Magie : dépense une Forme sauvage pour faire apparaître pendant 1 minute un cube de 4,50 m de côté de végétation spectrale au sol, à 36 m. Toi et tes alliés avez un demi-abri dans la zone, et tes alliés y gagnent la résistance actuellement accordée par Garde de la nature. Action bonus : déplace le cube jusqu'à 18 m, toujours sur un sol à 36 m. L'effet cesse si tu es Incapable d'agir ou si tu meurs."
            }
          ]
        },
        {
          "id": "lune",
          "name": "Cercle de la Lune",
          "src": "verifie",
          "desc": "Le seul cercle qui renforce vraiment la Forme sauvage : meilleure CA, PV temporaires, dégâts radiants.",
          "features": [
            {
              "level": 3,
              "name": "Sorts du cercle de la Lune",
              "desc": "Toujours préparés selon ton niveau de druide : Soins, Rayon de lune et Étincelle stellaire (3), Appel des animaux (5), Source de clair de lune (7), Soins de groupe (9). Tu peux les lancer même en Forme sauvage, sans attendre le niveau 18."
            },
            {
              "level": 3,
              "name": "Formes du cercle",
              "desc": "En Forme sauvage : ta classe d'armure devient 13 + ton modificateur de Sagesse si c'est mieux que celle de la bête, tu gagnes trois fois ton niveau de druide en points de vie temporaires, et le facteur de puissance maximal de tes formes égale ton niveau divisé par 3 (arrondi à l'inférieur). Dès le niveau 3, tu peux devenir un ours brun."
            },
            {
              "level": 6,
              "name": "Éclat lunaire",
              "desc": "Chacune de tes attaques en Forme sauvage inflige au choix son type de dégâts habituel ou des dégâts radiants — tu décides à chaque coup porté. Tu ajoutes aussi ton modificateur de Sagesse à tes sauvegardes de Constitution, ce qui aide énormément à tenir ta concentration."
            },
            {
              "level": 10,
              "name": "Pas de lune",
              "desc": "Action bonus : téléporte-toi jusqu'à 9 m vers un espace libre visible ; tu as l'avantage au prochain jet d'attaque effectué avant la fin de ce tour. Utilisations égales à ton modificateur de Sagesse (minimum 1), récupérées au repos long. Sans action, tu peux aussi dépenser un emplacement de niveau 2 ou plus pour récupérer une utilisation par emplacement dépensé."
            },
            {
              "level": 14,
              "name": "Forme lunaire",
              "desc": "Éclat lunaire amélioré : une fois par tour, tu infliges 2d10 dégâts radiants supplémentaires avec une attaque de Forme sauvage. Clair de lune partagé : ton Pas de lune emmène aussi une créature consentante à 3 m de toi."
            }
          ]
        },
        {
          "id": "mer",
          "name": "Cercle de la Mer",
          "src": "verifie",
          "desc": "Nouveau en 2024, et le plus régulier des quatre : une aura qui blesse et repousse, chaque tour, sans concentration.",
          "features": [
            {
              "level": 3,
              "name": "Courroux de la mer",
              "desc": "Action bonus : dépense une Forme sauvage pour manifester pendant 10 minutes une émanation d'embruns de 1,50 m autour de toi. À sa manifestation puis par une action bonus à chacun de tes tours suivants, choisis une créature visible dans l'émanation : sauvegarde de Constitution ; en cas d'échec, elle subit un nombre de d6 de dégâts de froid égal à ton modificateur de Sagesse (minimum 1 dé) et, si elle est de taille G ou inférieure, tu peux la repousser jusqu'à 4,50 m."
            },
            {
              "level": 3,
              "name": "Sorts du cercle",
              "desc": "Toujours préparés selon ton niveau de druide : Nappe de brouillard, Bourrasque, Rayon de givre, Fracassement et Vague tonnante (3), Éclair et Respiration aquatique (5), Contrôle de l'eau et Tempête de grêle (7), Appel d'un élémentaire et Immobilisation de monstre (9)."
            },
            {
              "level": 6,
              "name": "Affinité aquatique",
              "desc": "Le rayon de l'émanation de Courroux de la mer passe à 3 m. Tu gagnes aussi une vitesse de nage égale à ta vitesse. Cette capacité ne donne pas la respiration aquatique."
            },
            {
              "level": 10,
              "name": "Né de la tempête",
              "desc": "Pendant ton Courroux de la mer, tu obtiens une vitesse de vol et la résistance aux dégâts de froid, de foudre et de tonnerre."
            },
            {
              "level": 14,
              "name": "Don océanique",
              "desc": "Tu peux manifester ton Courroux de la mer autour d'un allié à 18 m, qui en reçoit tous les bénéfices calculés sur ta Sagesse. En dépensant une utilisation supplémentaire, tu le gardes aussi sur toi."
            }
          ]
        },
        {
          "id": "etoiles",
          "name": "Cercle des Étoiles",
          "src": "verifie",
          "desc": "Une forme stellaire qui garde tes statistiques : tu restes toi-même et tu choisis ta constellation selon le besoin.",
          "features": [
            {
              "level": 3,
              "name": "Carte stellaire",
              "desc": "Tu crées une carte du ciel, objet minuscule servant de focaliseur d'incantation. En la tenant, tu as Assistance et Trait de lumière préparés, et tu peux lancer Trait de lumière sans emplacement, un nombre de fois égal à ton modificateur de Sagesse, récupéré au repos long. Perdue, elle se recrée par une cérémonie d'une heure."
            },
            {
              "level": 3,
              "name": "Forme stellaire",
              "desc": "Action bonus : tu dépenses une utilisation de Forme sauvage pour revêtir une forme stellaire pendant 10 minutes sans te changer en bête — tu gardes tes statistiques. Elle prend fin si tu la quittes volontairement (sans action), si tu es Incapable d'agir, ou si tu la réactives. Choisis une constellation. Archer : à l'activation puis par une action bonus à tes tours suivants, tu fais une attaque de sort à distance à 18 m pour 1d8 + ton modificateur de Sagesse dégâts radiants. Calice : quand un sort que tu lances avec un emplacement rend des points de vie, toi ou une créature visible à 9 m en récupérez 1d8 + ton modificateur de Sagesse. Dragon : sur tes tests d'Intelligence et de Sagesse et sur tes sauvegardes de Constitution pour la concentration, un résultat naturel de 9 ou moins compte comme un 10."
            },
            {
              "level": 6,
              "name": "Présage cosmique",
              "desc": "Après chaque repos long, tire au sort pair ou impair. Pair : ta réaction ajoute 1d6 au test. Impair : ta réaction retire 1d6. Le déclencheur est une créature visible à 9 m sur le point de faire un test de d20. Utilisations égales à ton modificateur de Sagesse (minimum 1) par repos long."
            },
            {
              "level": 10,
              "name": "Constellations scintillantes",
              "desc": "L'Archer et le Calice passent de 1d8 à 2d8. Le Dragon te donne une vitesse de vol de 6 m et le vol stationnaire. Au début de chacun de tes tours en Forme stellaire, tu peux changer gratuitement de constellation."
            },
            {
              "level": 14,
              "name": "Plein d'étoiles",
              "desc": "Pendant ta Forme stellaire, tu as la résistance aux dégâts contondants, perforants et tranchants. Cette capacité ne réduit aucun coût."
            }
          ]
        }
      ]
    },
    "barde": {
      "choiceLevel": 3,
      "label": "Collège bardique",
      "options": [
        {
          "id": "savoir",
          "name": "Collège du Savoir",
          "src": "verifie",
          "desc": "L'érudit railleur qui collectionne les talents, les sorts d'autres traditions et les mots capables de faire échouer un adversaire.",
          "features": [
            {
              "level": 3,
              "name": "Compétences bonus",
              "desc": "Tu gagnes la maîtrise de trois compétences de ton choix."
            },
            {
              "level": 3,
              "name": "Paroles cinglantes",
              "desc": "Réaction lorsqu'une créature visible à 18 m inflige des dégâts ou réussit un test ou une attaque : dépense une Inspiration et soustrais le dé aux dégâts ou au test, pouvant transformer le succès en échec."
            },
            {
              "level": 6,
              "name": "Découvertes magiques",
              "desc": "Choisis deux sorts de Clerc, Druide ou Magicien, sorts mineurs compris et d'un niveau lançable. Ils sont toujours préparés et remplaçables par un choix valide à chaque niveau de barde."
            },
            {
              "level": 14,
              "name": "Talent incomparable",
              "desc": "Après l'échec d'un test ou d'une attaque, ajoute un dé d'Inspiration ; si le test échoue encore, l'Inspiration n'est pas dépensée."
            }
          ]
        },
        {
          "id": "vaillance",
          "name": "Collège de la Vaillance",
          "src": "verifie",
          "desc": "Le chroniqueur de guerre, protégé et armé, qui transforme l'Inspiration en défense ou dégâts et mêle attaques et sorts.",
          "features": [
            {
              "level": 3,
              "name": "Inspiration au combat",
              "desc": "Une créature portant ton dé d'Inspiration peut, par réaction après une touche, l'ajouter à sa CA contre l'attaque, ou l'ajouter aux dégâts juste après avoir touché."
            },
            {
              "level": 3,
              "name": "Formation martiale",
              "desc": "Maîtrise des armes de guerre, armures intermédiaires et boucliers. Une arme simple ou de guerre peut servir de focaliseur pour tes sorts de barde."
            },
            {
              "level": 6,
              "name": "Attaque supplémentaire",
              "desc": "Deux attaques dans l'action Attaquer ; l'une peut être remplacée par un sort mineur dont l'incantation demande une action."
            },
            {
              "level": 14,
              "name": "Magie de bataille",
              "desc": "Après avoir lancé un sort dont l'incantation demande une action, tu peux attaquer avec une arme par action bonus."
            }
          ]
        },
        {
          "id": "danse",
          "name": "Collège de la Danse",
          "src": "verifie",
          "desc": "Le virtuose du mouvement cosmique, sans armure, qui frappe en dépensant son Inspiration et entraîne ses alliés dans son élan.",
          "features": [
            {
              "level": 3,
              "name": "Jeu de jambes éblouissant",
              "desc": "Sans armure ni bouclier : avantage en Représentation dansée ; CA 10 + Dextérité + Charisme ; après avoir dépensé une Inspiration dans une action, bonus ou réaction, ajoute une frappe à mains nues ; utilise Dextérité et inflige dé d'Inspiration + Dextérité contondants sans dépenser le dé.",
              "unarmoredAC": "cha",
              "noShield": true
            },
            {
              "level": 6,
              "name": "Mouvement inspirant",
              "desc": "Réaction lorsqu'un ennemi visible finit à 1,50 m et dépense une Inspiration : déplace-toi de la moitié de ta vitesse, puis un allié à 9 m peut faire de même avec sa réaction, sans attaques d'opportunité."
            },
            {
              "level": 6,
              "name": "Jeu de jambes en tandem",
              "desc": "À l'initiative, si tu n'es pas Incapable d'agir, dépense et lance une Inspiration : toi et les alliés à 9 m qui te perçoivent ajoutent le résultat à l'initiative."
            },
            {
              "level": 14,
              "name": "Esquive directrice",
              "desc": "Comme Esquive totale sur les sauvegardes de Dextérité pour demi-dégâts ; partage ce bénéfice avec les créatures à 1,50 m faisant la même sauvegarde, sauf si tu es Incapable d'agir."
            }
          ]
        },
        {
          "id": "glamour",
          "name": "Collège du Charme",
          "src": "verifie",
          "desc": "Le tisseur de magie féerique, qui mêle beauté, peur, mobilité collective et majesté surnaturelle.",
          "features": [
            {
              "level": 3,
              "name": "Magie envoûtante",
              "desc": "Charme-personne et Image miroir toujours préparés. Après un Enchantement ou une Illusion avec emplacement, une créature visible à 18 m fait une sauvegarde de Sagesse ou est Charmée ou Effrayée pendant 1 minute. Une fois par repos long, restaurable par une Inspiration."
            },
            {
              "level": 3,
              "name": "Manteau d'inspiration",
              "desc": "Action bonus et Inspiration : lance le dé, puis jusqu'à Charisme autres créatures à 18 m gagnent deux fois le résultat en PV temporaires et peuvent utiliser leur réaction pour se déplacer sans attaque d'opportunité."
            },
            {
              "level": 6,
              "name": "Manteau de majesté",
              "desc": "Injonction toujours préparée. Action bonus : lance-le sans emplacement et adopte une apparence majestueuse pendant 1 minute ; durant cet effet, relance-le gratuitement en action bonus et tes créatures Charmées ratent automatiquement leur sauvegarde. Une fois par repos long, restaurable par un emplacement de niveau 3+."
            },
            {
              "level": 14,
              "name": "Majesté inviolable",
              "desc": "Action bonus, 1 minute : la première attaque qui te touche à chaque tour rate si l'assaillant échoue une sauvegarde de Charisme. Une fois par repos court ou long."
            }
          ]
        }
      ]
    },
    "occultiste": {
      "choiceLevel": 3,
      "label": "Patron d'un autre monde",
      "options": [
        {
          "id": "fielon",
          "name": "Patron Fiélon",
          "src": "verifie",
          "desc": "Un pacte infernal : points de vie temporaires à chaque mort, chance sombre, résistances changeantes.",
          "features": [
            {
              "level": 3,
              "name": "Bénédiction du Ténébreux",
              "desc": "Quand tu réduis un ennemi à 0 PV, ou quand quelqu'un d'autre réduit à 0 PV un ennemi situé à 3 m ou moins de toi, tu gagnes des PV temporaires égaux à ton modificateur de Charisme + ton niveau d'Occultiste, avec un minimum de 1."
            },
            {
              "level": 3,
              "name": "Sorts du patron",
              "desc": "Toujours préparés selon ton niveau d'Occultiste : Mains brûlantes, Injonction, Rayon ardent et Suggestion (3) ; Boule de feu et Nuage nauséabond (5) ; Bouclier de flammes et Mur de feu (7) ; Quête et Fléau d'insectes (9). Ces sorts ne comptent pas dans ton quota normal de sorts préparés."
            },
            {
              "level": 6,
              "name": "Chance du Ténébreux",
              "desc": "Tu ajoutes 1d10 à un test de caractéristique ou une sauvegarde, après avoir vu le dé mais avant de connaître le résultat. Utilisations égales à ton modificateur de Charisme, récupérées au repos long."
            },
            {
              "level": 10,
              "name": "Résilience fiélone",
              "desc": "Quand tu termines un repos court ou long, choisis un type de dégâts autre que Force. Tu as la résistance à ce type jusqu'à ce que tu en choisisses un autre avec cette capacité."
            },
            {
              "level": 14,
              "name": "Précipiter en enfer",
              "desc": "Une fois par tour quand tu touches une créature avec un jet d'attaque, tu peux lui imposer une sauvegarde de Charisme contre ton DD de sort. En cas d'échec, elle disparaît jusqu'à la fin de ton prochain tour, est Incapable d'agir et, si elle n'est pas un Fiélon, subit 8d10 dégâts psychiques. Elle revient dans son espace précédent ou le plus proche espace libre. Une utilisation par repos long, restaurable sans action en dépensant un emplacement de Magie de pacte."
            }
          ]
        },
        {
          "id": "celeste",
          "name": "Patron Céleste",
          "src": "verifie",
          "desc": "Une lumière protectrice : la seule voie de l'occultiste avec une vraie réserve de soins.",
          "features": [
            {
              "level": 3,
              "name": "Lumière guérisseuse",
              "desc": "Une réserve de d6 égale à 1 + ton niveau d'occultiste. Action bonus : tu dépenses jusqu'à ton modificateur de Charisme en dés pour soigner une créature à 18 m. Réserve restaurée au repos long."
            },
            {
              "level": 3,
              "name": "Sorts du patron",
              "desc": "Toujours préparés selon ton niveau d'Occultiste : Aide, Soins, Trait de lumière, Restauration partielle, Lumière et Flamme sacrée (3) ; Lumière du jour et Rappel à la vie immédiat (5) ; Gardien de la foi et Mur de feu (7) ; Restauration supérieure et Invocation d'un céleste (9). Ces sorts ne comptent pas dans ton quota normal de sorts préparés."
            },
            {
              "level": 10,
              "name": "Résilience céleste",
              "desc": "Après ta Ruse magique ou un repos court ou long, tu gagnes des PV temporaires égaux à ton niveau d'Occultiste + ton modificateur de Charisme. Tu peux choisir jusqu'à cinq créatures visibles ; chacune gagne des PV temporaires égaux à la moitié de ton niveau d'Occultiste + ton modificateur de Charisme."
            },
            {
              "level": 6,
              "name": "Âme radiante",
              "desc": "Tu résistes aux dégâts radiants, et tu ajoutes ton modificateur de Charisme aux dégâts d'un sort de feu ou radiant, une fois par tour."
            },
            {
              "level": 14,
              "name": "Vengeance ardente",
              "desc": "Quand toi ou un allié à 18 m est sur le point d'effectuer un jet de sauvegarde contre la mort, tu peux déclencher cette capacité : cette créature récupère la moitié de son maximum de PV et peut mettre fin à l'état À terre. Chaque créature de ton choix à 9 m d'elle subit 2d8 + ton modificateur de Charisme dégâts radiants et est Aveuglée jusqu'à la fin du tour en cours. Une fois par repos long."
            }
          ]
        },
        {
          "id": "archifee",
          "name": "Patron Archifée",
          "src": "verifie",
          "desc": "Le spécialiste de la téléportation : des Pas brumeux gratuits, assortis d'effets à chaque saut.",
          "features": [
            {
              "level": 3,
              "name": "Pas des fées",
              "desc": "Tu peux lancer Pas brumeux sans emplacement un nombre de fois égal à ton modificateur de Charisme (minimum 1), récupérées au repos long. À chaque lancement, choisis : Pas rafraîchissant — après la téléportation, toi ou une créature visible à 3 m gagnez 1d10 PV temporaires ; Pas provocateur — les créatures à 1,50 m de l'espace quitté font une sauvegarde de Sagesse ou ont le désavantage aux attaques contre les créatures autres que toi jusqu'au début de ton prochain tour."
            },
            {
              "level": 3,
              "name": "Sorts du patron",
              "desc": "Toujours préparés selon ton niveau d'Occultiste : Apaisement des émotions, Lueurs féeriques, Pas brumeux, Force fantasmagorique et Sommeil (3) ; Clignotement et Croissance végétale (5) ; Domination de bête et Invisibilité supérieure (7) ; Domination de personne et Apparence trompeuse (9). Ces sorts ne comptent pas dans ton quota normal de sorts préparés."
            },
            {
              "level": 6,
              "name": "Évasion brumeuse",
              "desc": "Quand tu subis des dégâts, tu peux lancer Pas brumeux en réaction. Deux nouveaux effets de Pas des fées deviennent disponibles : Pas disparaissant — Invisible jusqu'au début de ton prochain tour ou jusqu'après une attaque, des dégâts infligés ou un sort lancé ; Pas effroyable — les créatures à 1,50 m de l'espace quitté ou de l'espace d'arrivée (au choix) font une sauvegarde de Sagesse ou subissent 2d10 dégâts psychiques."
            },
            {
              "level": 10,
              "name": "Défenses enjôleuses",
              "desc": "Tu es immunisé à l'état Charmé. Immédiatement après qu'une créature visible t'a touché avec un jet d'attaque, ta réaction réduit de moitié les dégâts subis (arrondi à l'inférieur) et force l'attaquant à faire une sauvegarde de Sagesse ; en cas d'échec, il subit autant de dégâts psychiques que les dégâts que tu as réellement subis. Une fois par repos long, mais tu peux restaurer l'utilisation en dépensant un emplacement de Magie de pacte, sans action."
            },
            {
              "level": 14,
              "name": "Magie envoûtante",
              "desc": "Immédiatement après avoir lancé avec une action ET un emplacement un sort d'Enchantement ou d'Illusion, tu peux lancer Pas brumeux dans le cadre de cette même action, sans dépenser d'emplacement pour Pas brumeux."
            }
          ]
        },
        {
          "id": "grand",
          "name": "Patron Grand Ancien",
          "src": "verifie",
          "desc": "L'intelligence indicible : télépathie, sorts sans composante, dégâts psychiques et esprits brisés.",
          "features": [
            {
              "level": 3,
              "name": "Esprit éveillé",
              "desc": "Action bonus : choisis une créature visible à 9 m. Vous pouvez communiquer télépathiquement tant que vous restez à une distance en miles égale à ton modificateur de Charisme (minimum 1). Chacun doit mentalement utiliser une langue connue de l'autre. Le lien dure un nombre de minutes égal à ton niveau d'Occultiste et se termine si tu en crées un autre."
            },
            {
              "level": 3,
              "name": "Sorts psychiques",
              "desc": "Quand un sort d'Occultiste inflige des dégâts, tu peux les convertir en dégâts psychiques. Tes sorts d'Occultiste d'Enchantement et d'Illusion peuvent être lancés sans composante verbale ni somatique ; toute composante matérielle reste requise."
            },
            {
              "level": 3,
              "name": "Sorts du patron",
              "desc": "Niveau 3 : Détection des pensées, Murmures dissonants, Force fantasmagorique et Fou rire. Niveau 5 : Clairvoyance et Faim de Hadar. Ces sorts sont toujours préparés et ne comptent pas dans ton quota normal."
            },
            {
              "level": 6,
              "name": "Combattant clairvoyant",
              "desc": "Quand tu formes un lien avec Esprit éveillé, tu peux imposer une sauvegarde de Sagesse contre ton DD de sort. En cas d'échec, tu as l'avantage aux attaques contre la cible et elle a le désavantage aux attaques contre toi tant que le lien dure. Une utilisation par repos court ou long ; un emplacement de Magie de pacte restaure l'usage sans action."
            },
            {
              "level": 10,
              "name": "Bouclier mental",
              "desc": "Tes pensées ne peuvent pas être lues sans ton accord. Tu as la résistance aux dégâts psychiques ; quand une créature t'en inflige, elle subit autant de dégâts psychiques que ceux que tu as réellement reçus."
            },
            {
              "level": 10,
              "name": "Maléfice occulte",
              "desc": "Maléfice est toujours préparé. La créature affectée a aussi le désavantage aux sauvegardes de la caractéristique choisie pour le sort."
            },
            {
              "level": 14,
              "name": "Créer un serviteur",
              "desc": "Quand tu lances Invocation d’une aberration, tu peux supprimer sa Concentration. Le sort dure alors 1 minute et le serviteur gagne un nombre de PV temporaires égal à ton niveau d’Occultiste + ton modificateur de Charisme. La première fois de chacun de ses tours où il touche la cible de ton Maléfice, il inflige aussi 1d6 dégâts psychiques."
            }
          ]
        }
      ]
    },
    "ensorceleur": {
      "choiceLevel": 3,
      "label": "Origine de sorcellerie",
      "options": [
        {
          "id": "draconique",
          "name": "Sorcellerie draconique",
          "src": "verifie",
          "desc": "Un don draconique devenu magie innée : écailles, affinité élémentaire, ailes et compagnon invoqué.",
          "features": [
            {
              "level": 3,
              "name": "Résilience draconique",
              "desc": "Ton maximum de points de vie augmente de 3, puis de 1 à chaque nouveau niveau d'ensorceleur. Sans armure, ta CA de base vaut 10 + Dextérité + Charisme.",
              "unarmoredAC": "cha"
            },
            {
              "level": 3,
              "name": "Sorts draconiques",
              "desc": "Altération de soi, Orbe chromatique, Injonction et Souffle du dragon sont toujours préparés ; puis Peur et Vol au niveau 5, Œil arcanique et Charme-monstre au niveau 7, Connaissance des légendes et Invocation d'un dragon au niveau 9."
            },
            {
              "level": 6,
              "name": "Affinité élémentaire",
              "desc": "Choisis acide, froid, feu, foudre ou poison. Tu résistes à ce type et ajoutes ton modificateur de Charisme à un jet de dégâts d'un sort qui l'inflige."
            },
            {
              "level": 14,
              "name": "Ailes de dragon",
              "desc": "Action bonus : des ailes apparaissent pendant 1 heure et te donnent une vitesse de vol de 18 m. Une fois par repos long, restaurable pour 3 points de sorcellerie."
            },
            {
              "level": 18,
              "name": "Compagnon draconique",
              "desc": "Invocation d'un dragon ne demande plus de composante matérielle et peut être lancée une fois sans emplacement par repos long. À chaque lancement, tu peux retirer la concentration en ramenant sa durée à 1 minute."
            }
          ]
        },
        {
          "id": "sauvage",
          "name": "Magie sauvage",
          "src": "verifie",
          "desc": "Le chaos incarné : surtensions, chance infléchie et, au sommet, choix direct d'un effet sauvage.",
          "features": [
            {
              "level": 3,
              "name": "Surtension de magie sauvage",
              "desc": "Une fois par tour, juste après un sort d'ensorceleur lancé avec un emplacement, tu peux lancer 1d20. Sur 20, applique un résultat de la table de Magie sauvage ; un sort ainsi produit ne peut recevoir de Métamagie."
            },
            {
              "level": 3,
              "name": "Marées du chaos",
              "desc": "Avant un test de d20, donne-toi l'avantage. Avant de pouvoir recommencer, tu dois finir un repos long ou lancer un sort d'ensorceleur avec emplacement ; dans ce dernier cas, déclenche automatiquement une surtension."
            },
            {
              "level": 6,
              "name": "Infléchir la chance",
              "desc": "Réaction après le test de d20 visible d'une autre créature et 1 point de sorcellerie : lance 1d4 et ajoute ou soustrais le résultat au d20."
            },
            {
              "level": 14,
              "name": "Chaos contrôlé",
              "desc": "Quand tu lances sur la table de Magie sauvage, lance deux fois et choisis l'un des deux résultats."
            },
            {
              "level": 18,
              "name": "Surtension domptée",
              "desc": "Après un sort d'ensorceleur avec emplacement, choisis directement un effet de la table de Magie sauvage, sauf sa dernière ligne, au lieu de lancer. Une fois par repos long."
            }
          ]
        },
        {
          "id": "aberrante",
          "name": "Sorcellerie aberrante",
          "src": "verifie",
          "desc": "Une influence étrangère a embrasé ton esprit : lien télépathique, magie psionique et corps impossible.",
          "features": [
            {
              "level": 3,
              "name": "Sorts psioniques",
              "desc": "Onze sorts thématiques sont toujours préparés, d'Éclat mental et Bras de Hadar jusqu'à Lien télépathique de Rary et Télékinésie."
            },
            {
              "level": 3,
              "name": "Discours télépathique",
              "desc": "Action bonus : lie ton esprit à une créature visible à 9 m. Pendant un nombre de minutes égal à ton niveau, vous communiquez télépathiquement à une distance en kilomètres égale à ton Charisme, si vous partagez une langue."
            },
            {
              "level": 6,
              "name": "Sorcellerie psionique",
              "desc": "Un sort de niveau 1+ de ta liste psionique peut être lancé normalement ou avec autant de points de sorcellerie que son niveau. Avec les points, il perd ses composantes verbale et somatique, ainsi que les composantes matérielles sans prix et non consommées."
            },
            {
              "level": 6,
              "name": "Défenses psychiques",
              "desc": "Résistance aux dégâts psychiques et avantage aux sauvegardes pour éviter ou terminer les états Charmé et Effrayé."
            },
            {
              "level": 14,
              "name": "Révélation charnelle",
              "desc": "Action bonus, 10 minutes : dépense au moins 1 point de sorcellerie et choisis un bénéfice par point — nage et respiration aquatique, vol stationnaire, perception des créatures invisibles à 18 m, ou passage dans un interstice de 2,5 cm et libération des entraves."
            },
            {
              "level": 18,
              "name": "Implosion déformante",
              "desc": "Action Magie : téléporte-toi de 36 m. Les créatures à 9 m de ton départ font une sauvegarde de Force : 3d10 force et attraction vers ton ancienne position, moitié des dégâts sans attraction en cas de réussite. Une fois par repos long, restaurable pour 5 points de sorcellerie."
            }
          ]
        },
        {
          "id": "mecanique",
          "name": "Sorcellerie mécanique",
          "src": "verifie",
          "desc": "L'ordre cosmique de Mechanus : équilibre imposé, rempart mathématique et perfection momentanée.",
          "features": [
            {
              "level": 3,
              "name": "Sorts mécaniques",
              "desc": "Dix sorts d'ordre sont toujours préparés, d'Alarme et Aide jusqu'à Restauration supérieure et Mur de force."
            },
            {
              "level": 3,
              "name": "Restaurer l'équilibre",
              "desc": "Réaction lorsqu'une créature visible à 18 m va lancer un d20 avec avantage ou désavantage : annule les deux pour ce jet. Utilisations égales à ton Charisme par repos long."
            },
            {
              "level": 6,
              "name": "Bastion de la loi",
              "desc": "Action Magie : dépense 1 à 5 points de sorcellerie pour entourer une créature à 9 m d'autant de d8. Quand elle subit des dégâts, elle dépense et lance autant de ces dés qu'elle veut pour les réduire. Le rempart dure jusqu'au repos long ou à ton prochain usage."
            },
            {
              "level": 14,
              "name": "Transe de l'ordre",
              "desc": "Action bonus, 1 minute : les attaques contre toi ne bénéficient pas de l'avantage et tes résultats naturels de 9 ou moins aux tests de d20 deviennent 10. Une fois par repos long, restaurable pour 5 points de sorcellerie."
            },
            {
              "level": 18,
              "name": "Cavalcade mécanique",
              "desc": "Action Magie : dans un cube de 9 m depuis toi, répartis jusqu'à 100 PV de soins, répare les objets entièrement dans la zone et termine les sorts de niveau 6 ou moins sur les créatures et objets choisis. Une fois par repos long, restaurable pour 7 points de sorcellerie."
            }
          ]
        }
      ]
    },
    "moine": {
      "choiceLevel": 3,
      "label": "Sous-classe de moine",
      "options": [
        {
          "id": "mainouverte",
          "name": "Guerrier de la Main ouverte",
          "src": "verifie",
          "desc": "Le maître du combat à mains nues, qui déstabilise, repousse, se soigne et place des vibrations dévastatrices.",
          "features": [
            {
              "level": 3,
              "name": "Technique de la Main ouverte",
              "desc": "Après une touche de Rafale de coups, choisis : empêcher les attaques d'opportunité de la cible jusqu'à son prochain tour, la pousser de 4,50 m sur sauvegarde de Force, ou lui donner l'état À terre sur sauvegarde de Dextérité."
            },
            {
              "level": 6,
              "name": "Plénitude physique",
              "desc": "Action bonus : récupère un dé d'Arts martiaux + Sagesse PV (minimum 1). Utilisations égales au modificateur de Sagesse par repos long."
            },
            {
              "level": 11,
              "name": "Pas véloce",
              "desc": "Après une action bonus autre que Pas du vent, tu peux aussi utiliser Pas du vent immédiatement après cette action bonus."
            },
            {
              "level": 17,
              "name": "Paume frémissante",
              "desc": "Après une frappe à mains nues, dépense 4 Focus pour placer des vibrations pendant un nombre de jours égal à ton niveau. Une action, ou une attaque sacrifiée dans l'action Attaquer, les déclenche sur le même plan : sauvegarde de Constitution, 10d12 force, moitié en cas de réussite."
            }
          ]
        },
        {
          "id": "ombre",
          "name": "Guerrier de l'Ombre",
          "src": "verifie",
          "desc": "Le combattant du Plan de l'Ombre, qui crée et traverse les ténèbres avant de devenir presque incorporel.",
          "features": [
            {
              "level": 3,
              "name": "Arts de l'ombre",
              "desc": "Dépense 1 Focus pour lancer Ténèbres sans composante, y voir et déplacer sa zone de 18 m au début de tes tours. Tu gagnes 18 m de vision dans le noir supplémentaire et connais Illusion mineure avec la Sagesse."
            },
            {
              "level": 6,
              "name": "Pas d'ombre",
              "desc": "Entièrement dans la lumière faible ou les ténèbres, action bonus pour te téléporter de 18 m vers une zone similaire visible ; avantage à ta prochaine attaque de corps à corps ce tour-ci."
            },
            {
              "level": 11,
              "name": "Pas d'ombre amélioré",
              "desc": "Quand tu utilises Pas d'ombre, dépense 1 Focus pour ignorer les exigences de lumière et porter aussitôt une frappe à mains nues dans la même action bonus."
            },
            {
              "level": 17,
              "name": "Cape d'ombres",
              "desc": "Action Magie dans la lumière faible ou les ténèbres et 3 Focus : pendant 1 minute, Invisible, déplacement à travers les espaces occupés comme terrain difficile et Rafale de coups gratuite. Prend fin si Incapacité ou si tu termines en lumière vive."
            }
          ]
        },
        {
          "id": "misericorde",
          "name": "Guerrier de la Miséricorde",
          "src": "verifie",
          "desc": "Le médecin itinérant qui manipule la force vitale pour soigner, empoisonner ou rappeler un mort récent.",
          "features": [
            {
              "level": 3,
              "name": "Main de douleur",
              "desc": "Une fois par tour après une frappe à mains nues infligeant des dégâts, dépense 1 Focus pour ajouter un dé d'Arts martiaux + Sagesse dégâts nécrotiques."
            },
            {
              "level": 3,
              "name": "Main de guérison",
              "desc": "Action Magie et 1 Focus : touche une créature et soigne un dé d'Arts martiaux + Sagesse. Dans Rafale de coups, remplace une frappe par ce soin sans coût de Focus."
            },
            {
              "level": 3,
              "name": "Instruments de miséricorde",
              "desc": "Maîtrise d'Intuition, de Médecine et du nécessaire d'herboriste."
            },
            {
              "level": 6,
              "name": "Toucher du médecin",
              "desc": "Main de douleur peut Empoisonner jusqu'à la fin de ton prochain tour. Main de guérison peut retirer Aveuglé, Assourdi, Paralysé, Empoisonné ou Étourdi."
            },
            {
              "level": 11,
              "name": "Rafale de guérison et de douleur",
              "desc": "Dans Rafale de coups, remplace chaque frappe par Main de guérison sans Focus, ou applique Main de douleur gratuitement sur une frappe, toujours une fois par tour. Total d'usages égal à Sagesse par repos long."
            },
            {
              "level": 17,
              "name": "Main de l'ultime miséricorde",
              "desc": "Action Magie, touche un cadavre mort depuis moins de 24 h et dépense 5 Focus : il revient avec 4d10 + Sagesse PV, sans certains états. Une fois par repos long."
            }
          ]
        },
        {
          "id": "elements",
          "name": "Guerrier des Éléments",
          "src": "verifie",
          "desc": "Le canal des Plans élémentaires, dont les frappes gagnent allonge, type élémentaire et contrôle du champ de bataille.",
          "features": [
            {
              "level": 3,
              "name": "Harmonisation élémentaire",
              "desc": "Au début de ton tour, dépense 1 Focus pour 10 minutes : allonge des frappes à mains nues augmentée de 3 m ; dégâts acide, froid, feu, foudre ou tonnerre ; sur une touche élémentaire, sauvegarde de Force pour attirer ou repousser de 3 m."
            },
            {
              "level": 3,
              "name": "Manipulation des éléments",
              "desc": "Tu connais le sort mineur Élémentalisme et utilises la Sagesse pour le lancer."
            },
            {
              "level": 6,
              "name": "Explosion élémentaire",
              "desc": "Action Magie et 2 Focus : sphère de 6 m à 36 m, sauvegarde de Dextérité ; trois dés d'Arts martiaux dégâts acide, froid, feu, foudre ou tonnerre, moitié en cas de réussite."
            },
            {
              "level": 11,
              "name": "Foulée des éléments",
              "desc": "Pendant Harmonisation élémentaire, vitesse de vol et vitesse de nage égales à ta vitesse."
            },
            {
              "level": 17,
              "name": "Épitomé élémentaire",
              "desc": "Pendant Harmonisation : résistance élémentaire modifiable à chaque tour ; Pas du vent ajoute 6 m et blesse une fois par tour les créatures frôlées ; une frappe par tour ajoute un dé d'Arts martiaux de son type."
            }
          ]
        }
      ]
    },
    "paladin": {
      "choiceLevel": 3,
      "label": "Serment sacré",
      "options": [
        {
          "id": "devotion",
          "name": "Serment de Dévotion",
          "src": "verifie",
          "desc": "Le chevalier de justice et d'ordre, qui sanctifie son arme et protège son aura contre la corruption.",
          "features": [
            {
              "level": 3,
              "name": "Sorts du serment de Dévotion",
              "desc": "Deux sorts sont toujours préparés aux niveaux de paladin 3, 5, 9, 13 et 17."
            },
            {
              "level": 3,
              "name": "Arme sacrée",
              "desc": "Dans l'action Attaquer, dépense un Conduit divin pour consacrer une arme de corps à corps tenue pendant 10 minutes : ajoute ton Charisme aux attaques (minimum +1), choisis dégâts normaux ou radiants à chaque coup, et l'arme produit de la lumière."
            },
            {
              "level": 7,
              "name": "Aura de dévotion",
              "desc": "Toi et tes alliés dans l'Aura de protection êtes immunisés à l'état Charmé ; un charme déjà présent y est suspendu."
            },
            {
              "level": 15,
              "name": "Châtiment protecteur",
              "desc": "Après ton Châtiment divin, toi et tes alliés dans l'Aura de protection bénéficiez d'un demi-couvert jusqu'au début de ton prochain tour."
            },
            {
              "level": 20,
              "name": "Nimbe sacré",
              "desc": "Action bonus, 10 minutes : avantage aux sauvegardes imposées par fiélons et morts-vivants ; les ennemis débutant leur tour dans l'aura subissent Charisme + maîtrise dégâts radiants ; l'aura devient lumière solaire. Une fois par repos long, restaurable par un emplacement de niveau 5."
            }
          ]
        },
        {
          "id": "anciens",
          "name": "Serment des Anciens",
          "src": "verifie",
          "desc": "Le gardien de la vie et de la lumière, lié à une magie primordiale de protection et de renouveau.",
          "features": [
            {
              "level": 3,
              "name": "Courroux de la nature",
              "desc": "Action Magie : dépense un Conduit divin ; les créatures choisies visibles à 4,50 m font une sauvegarde de Force ou sont Entravées pendant 1 minute, avec une nouvelle sauvegarde à chaque fin de tour."
            },
            {
              "level": 3,
              "name": "Sorts du serment des Anciens",
              "desc": "Deux sorts sont toujours préparés aux niveaux de paladin 3, 5, 9, 13 et 17."
            },
            {
              "level": 7,
              "name": "Aura de protection occulte",
              "desc": "Toi et tes alliés dans l'Aura de protection résistez aux dégâts nécrotiques, psychiques et radiants."
            },
            {
              "level": 15,
              "name": "Sentinelle immortelle",
              "desc": "Quand tu tombes à 0 PV sans mourir sur le coup, reste à 1 PV et récupère trois fois ton niveau de paladin PV, une fois par repos long. Tu ne peux plus vieillir magiquement et ton vieillissement visible cesse."
            },
            {
              "level": 20,
              "name": "Champion ancestral",
              "desc": "Action bonus, 1 minute : désavantage aux sauvegardes ennemies contre tes sorts et Conduits dans l'aura, régénération de 10 PV au début de tes tours et sorts d'une action lançables en action bonus. Une fois par repos long, restaurable par un emplacement de niveau 5."
            }
          ]
        },
        {
          "id": "vengeance",
          "name": "Serment de Vengeance",
          "src": "verifie",
          "desc": "Le poursuivant implacable des auteurs d'actes malfaisants, capable de déplacer son vœu d'une cible à l'autre.",
          "features": [
            {
              "level": 3,
              "name": "Sorts du serment de Vengeance",
              "desc": "Deux sorts sont toujours préparés aux niveaux de paladin 3, 5, 9, 13 et 17."
            },
            {
              "level": 3,
              "name": "Vœu d'inimitié",
              "desc": "Dans l'action Attaquer, dépense un Conduit divin et désigne une créature visible à 9 m : avantage aux attaques contre elle pendant 1 minute. Si elle tombe à 0 PV, transfère le vœu à une autre cible à 9 m sans action."
            },
            {
              "level": 7,
              "name": "Vengeur implacable",
              "desc": "Quand ton attaque d'opportunité touche, réduis la vitesse de la cible à 0 pour le tour puis déplace-toi de la moitié de ta vitesse dans la même réaction, sans provoquer d'attaque d'opportunité."
            },
            {
              "level": 15,
              "name": "Âme de vengeance",
              "desc": "Réaction juste après qu'une cible de ton Vœu touche ou rate une attaque : porte-lui une attaque de corps à corps si elle est à portée."
            },
            {
              "level": 20,
              "name": "Ange vengeur",
              "desc": "Action bonus, 10 minutes : vol stationnaire à 18 m et aura terrifiante ; les ennemis débutant dans l'aura font une sauvegarde de Sagesse ou sont Effrayés jusqu'aux dégâts. Une fois par repos long, restaurable par un emplacement de niveau 5."
            }
          ]
        },
        {
          "id": "gloire",
          "name": "Serment de Gloire",
          "src": "verifie",
          "desc": "L'athlète héroïque qui transforme ses exploits et ses châtiments en élan pour toute l'équipe.",
          "features": [
            {
              "level": 3,
              "name": "Châtiment inspirant",
              "desc": "Juste après Châtiment divin, dépense un Conduit divin pour répartir 2d8 + niveau de paladin PV temporaires entre les créatures choisies à 9 m, toi compris."
            },
            {
              "level": 3,
              "name": "Sorts du serment de Gloire",
              "desc": "Deux sorts sont toujours préparés aux niveaux de paladin 3, 5, 9, 13 et 17."
            },
            {
              "level": 3,
              "name": "Athlète hors pair",
              "desc": "Action bonus et Conduit divin : pendant 1 heure, avantage en Athlétisme et Acrobaties et sauts en longueur/hauteur augmentés de 3 m, en dépensant normalement ce mouvement."
            },
            {
              "level": 7,
              "name": "Aura de célérité",
              "desc": "Ta vitesse augmente de 3 m. Un allié entrant pour la première fois dans ton Aura de protection ou y débutant son tour gagne 3 m de vitesse jusqu'à la fin de son prochain tour."
            },
            {
              "level": 15,
              "name": "Défense glorieuse",
              "desc": "Réaction lorsqu'une créature visible à 3 m est touchée : ajoute ton Charisme (minimum +1) à sa CA contre l'attaque ; si elle rate, attaque l'assaillant s'il est à portée. Utilisations égales au Charisme par repos long."
            },
            {
              "level": 20,
              "name": "Légende vivante",
              "desc": "Action bonus, 10 minutes : avantage aux tests de Charisme, réaction pour relancer une sauvegarde ratée et une attaque d'arme ratée transformée en touche par tour. Une fois par repos long, restaurable par un emplacement de niveau 5."
            }
          ]
        }
      ]
    }
  };

export const subclassGroupFor = (classId: string): SubclassGroup | undefined => SUBCLASSES[classId];

/** Retrouve une sous-classe par son nom exact, tel qu'il est stocké sur une fiche. */
export const subclassByName = (name: string | null | undefined): SubclassOption | undefined => {
  if (!name) return undefined;
  for (const group of Object.values(SUBCLASSES)) {
    const found = group.options.find((option) => option.name === name);
    if (found) return found;
  }
  return undefined;
};

/** Capacités de sous-classe acquises jusqu'à ce niveau de classe inclus. */
export const subclassFeaturesUpTo = (name: string | null | undefined, level: number): SubclassFeature[] =>
  (subclassByName(name)?.features ?? []).filter((feature) => level >= feature.level);
