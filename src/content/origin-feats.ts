/**
 * Dons d'origine — PHB 2024, tels que les accordent les seize origines de
 * `backgrounds.ts` (chaque origine référence l'un d'eux par son `featId`).
 *
 * ⚠️ Repêché de la SORTIE CONSTRUITE de `table-connectee/src/App.jsx`
 * (`FEATS`) : la chaîne de plugins réécrit cette table.
 *
 * Les dons généraux, de style de combat et les dons épiques ne sont pas ici :
 * ils vivent déjà dans `src/content/feats.ts`, repris intact à l'étape 1.
 * Les indicateurs booléens (`initProf`, `luck`…) marquent les dons dont le
 * moteur applique l'effet directement.
 */

export interface OriginFeat {
  name: string;
  desc: string;
  [key: string]: unknown;
}

export const ORIGIN_FEATS: Record<string, OriginFeat> = {
    "vigilant": {
      "name": "Vigilant",
      "initProf": true,
      "desc": "Maîtrise de l'initiative : tu ajoutes ton bonus de maîtrise à tes jets d'initiative. Tu peux aussi échanger ton initiative avec celle d'un allié consentant juste après l'avoir lancée."
    },
    "artisan": {
      "name": "Artisan",
      "desc": "Maîtrise de trois outils d'artisan au choix, 20 % de remise sur les objets non magiques, et fabrication rapide d'objets simples entre deux repos longs."
    },
    "guerisseur": {
      "name": "Guérisseur",
      "desc": "En utilisant une trousse de soins par une action, une créature peut dépenser un dé de vie : elle récupère le résultat plus ton bonus de maîtrise. Tu relances aussi les 1 sur tes dés de soins."
    },
    "chanceux": {
      "name": "Chanceux",
      "luck": true,
      "desc": "Points de chance égaux à ton bonus de maîtrise, récupérés au repos long. Dépense-en un pour obtenir l'avantage à un jet de d20, ou pour imposer le désavantage à une attaque qui te vise."
    },
    "initie": {
      "name": "Initié à la magie",
      "desc": "Deux sorts mineurs et un sort de niveau 1 pris sur une liste de classe. Le sort de niveau 1 est toujours préparé et peut être lancé gratuitement une fois par repos long."
    },
    "musicien": {
      "name": "Musicien",
      "desc": "Maîtrise de trois instruments. À la fin d'un repos court ou long, tu accordes l'Inspiration héroïque à un nombre d'alliés égal à ton bonus de maîtrise."
    },
    "sauvage": {
      "name": "Attaquant sauvage",
      "savage": true,
      "desc": "Une fois par tour, quand tu touches avec une arme, tu peux relancer les dés de dégâts et choisir le meilleur des deux résultats."
    },
    "doue": {
      "name": "Doué",
      "desc": "Trois maîtrises supplémentaires au choix, parmi les compétences et les outils."
    },
    "bagarreur": {
      "name": "Bagarreur de taverne",
      "desc": "Ton attaque à mains nues inflige 1d4 + modificateur de Force en contondants, tu relances les 1 sur ces dégâts, et une fois par tour tu peux repousser ta cible de 1,50 m. Maîtrise des armes improvisées."
    },
    "robuste": {
      "name": "Robuste",
      "hpBonus": 2,
      "desc": "Ton maximum de points de vie augmente de 2 par niveau de personnage, immédiatement et à chaque montée de niveau."
    }
  };

export const originFeatById = (id: string | null | undefined): OriginFeat | undefined =>
  id ? ORIGIN_FEATS[id] : undefined;
