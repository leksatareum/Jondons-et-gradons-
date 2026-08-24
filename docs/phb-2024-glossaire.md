# Glossaire des règles — conformité PHB 2024

Appendice C, p. 359 à 376. Source unique : le PDF fourni par l'utilisateur.

Le glossaire dit ce que l'application a le **droit** d'appliquer seule. Cette
passe couvre les entrées dont l'application tient déjà l'état ; les autres sont
de la référence de table, pas de l'automatisation.

## Épuisement (p. 365)

| Règle | État |
|---|---|
| Cumulatif, un cran par acquisition | **AUTOMATISÉ** |
| **Tout test d20 réduit de 2 × le niveau** | **AUTOMATISÉ** — `derive.ts` |
| Vitesse réduite de 1,50 m × le niveau | **ASSISTÉ** — affiché ; la vitesse reste une valeur de table |
| Mort au sixième cran | **ASSISTÉ** — signalé en rouge |
| Un repos long retire un cran | **AUTOMATISÉ** — `model/rest.ts` |

L'application comptait les crans et les rendait au repos depuis le début, mais
**n'appliquait jamais la pénalité** : un personnage à 3 d'Épuisement affichait
exactement les mêmes bonus qu'à 0. Elle est désormais retirée des compétences
et des sauvegardes, et un bandeau la rappelle dans la zone figée du combat —
là où l'on jette.

La pénalité est exposée à part (`derived.exhaustion`) plutôt que fondue dans
les modificateurs de caractéristique : elle frappe les tests d20, pas les
dégâts ni le DD des sorts. Un test le verrouille.

## Les 14 états (p. 360-376)

Vérifiés un par un contre le glossaire. `src/domain/conditions.ts` les portait
déjà, correctement, **sans être importé par personne**.

| État | Vérifié | Note |
|---|---|---|
| Aveuglé, Assourdi, Charmé, Effrayé | ✅ | |
| Empoisonné, À terre, Entravé, Agrippé | ✅ | `speed0` manquait sur Entravé |
| Étourdi | ✅ | ne réduit **pas** la vitesse à 0 — c'était la règle de 2014 |
| Inconscient, Paralysé, Pétrifié | ✅ | |
| Incapable d'agir, Invisible | ✅ | |

Deux effets restent volontairement hors des champs structurés, parce qu'ils
sont **conditionnels** : le désavantage d'Effrayé ne vaut que si la source est
en vue, celui d'Agrippé que contre une autre cible que l'agrippeur. Les poser
dans `attack` les appliquerait à tort ; ils vivent dans la note, et un test
interdit de les y remettre.

**Reste à faire** : aucun écran ne permet encore de poser un état sur sa fiche.
Le module est vérifié, la fiche a le champ (`live.conditions`) — il manque
l'écran.

## PV temporaires (p. 375)

L'entrée renvoie au chapitre 1. Déjà appliqué : les dégâts s'y retirent
d'abord, et ils ne se cumulent pas. Voir `src/model/damage.ts`.

## Repos court et long (p. 369, 372)

Vérifiés lors de la passe P0 : le repos long rend **tous** les dés de vie
(l'application en rendait la moitié, règle de 2014) et retire un cran
d'Épuisement. Le texte de l'écran de repos affirmait encore « la moitié des
dés de vie » alors que le moteur était corrigé — remis d'accord.
