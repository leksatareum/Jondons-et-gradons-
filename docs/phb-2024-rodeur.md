# Rôdeur — conformité PHB 2024

Source unique : `PlayersHandbook2024.pdf` fourni par l'utilisateur. Pages
imprimées du livre. Rien n'a été reconstitué de mémoire.

## Tronc commun

| Niv. | Capacité | Page | État | Où |
|---|---|---|---|---|
| 1 | Incantation — 2 sorts préparés au niveau 1, table 1–20 | 119-120 | **AUTOMATISÉ** | `domain/spellcasting-progression.ts` |
| 1 | Ennemi juré — *Marque du chasseur* toujours préparée | 119 | **AUTOMATISÉ** | `content/always-prepared-spells.ts` |
| 1 | Ennemi juré — 2 lancements sans emplacement, 3/4/5/6 aux niveaux 5, 9, 13, 17 | 119-120 | **AUTOMATISÉ** | `domain/ranger-resources.ts` + `ui/spell-cards.ts` |
| 1 | Maîtrise d'armes — deux types d'armes, rechoisis au repos long | 120 | **MANQUANT** |
| 2 | Explorateur émérite — Expertise dans une compétence, deux langues | 120 | **RÉFÉRENCE** |
| 2 | Style de combat — dont **Guerrier druidique** (2 sorts mineurs de Druide) | 120 | **MANQUANT** |
| 3 | Archétype | 120 | **AUTOMATISÉ** | `content/subclasses.ts` |
| 4, 8, 12, 16 | Augmentation de caractéristique | 120 | **AUTOMATISÉ** | `model/level-up.ts` |
| 5 | Attaque supplémentaire | 120 | **AUTOMATISÉ** | `domain/multiclassing.ts` |
| 6 | Vagabond — +3 m hors armure lourde, escalade et nage | 121 | **RÉFÉRENCE** |
| 9 | Expertise — deux compétences | 121 | **RÉFÉRENCE** |
| 10 | Infatigable — PV temporaires 1d8 + SAG, SAG fois, repos long | 121 | **ASSISTÉ** | `model/rodeur.ts` (`utiliserInfatigable`) |
| 10 | Infatigable — un cran d'épuisement à chaque repos court | 121 | **AUTOMATISÉ** | `model/rest.ts` |
| 13 | Chasseur implacable — les dégâts ne brisent plus la concentration | 121 | **AUTOMATISÉ** | `model/rodeur.ts` |
| 14 | Voile de la nature — Invisible, SAG fois, repos long | 121 | **AUTOMATISÉ** (réserve) |
| 17 | Chasseur précis — avantage contre la cible marquée | 121 | **AUTOMATISÉ** | `model/rodeur.ts` |
| 18 | Sens bestiaux — vision aveugle 9 m | 121 | **RÉFÉRENCE** |
| 19 | Don épique | 121 | **AUTOMATISÉ** |
| 20 | Tueur d'ennemis — le dé de la marque passe à 1d10 | 121 | **AUTOMATISÉ** | `model/rodeur.ts` (`deBonusMarque`) |

## Chasseur

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Savoir du chasseur — immunités, résistances et vulnérabilités de la cible marquée | 127 | **RÉFÉRENCE** |
| 3 | Proie du chasseur — **deux** options, rechoisies à chaque repos | 127 | **ASSISTÉ** — décision proposée |
| 7 | Tactique défensive — **deux** options, rechoisies à chaque repos | 127 | **ASSISTÉ** — décision proposée |
| 11 | Proie du chasseur supérieure | 127 | **RÉFÉRENCE** |
| 15 | Défense supérieure | 127 | **RÉFÉRENCE** |

## Maître des bêtes

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Compagnon primordial — trois blocs, PV et CA dérivés du niveau et de la Sagesse | 122-123 | **AUTOMATISÉ** — `domain/linked-creatures.ts` |
| 7 | Entraînement exceptionnel | 122 | **RÉFÉRENCE** |
| 11 | Furie bestiale — deux Frappes, et les dégâts bonus de la marque | 122 | **AUTOMATISÉ** — `model/rodeur.ts` (`degatsBonusBeteCompagnon`) |
| 15 | Partage des sorts | 122 | **RÉFÉRENCE** |

## Vagabond féerique

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Frappes redoutables — 1d4 psychique, 1d6 au niveau 11 | 123 | **RÉFÉRENCE** |
| 3 | Sorts du vagabond (3/5/9/13/17) | 123 | **AUTOMATISÉ** |
| 3 | Charme d'outre-monde — bonus SAG aux tests de Charisme, une maîtrise au choix | 123 | **MANQUANT** (la maîtrise n'est pas demandée) |
| 7 | Torsion enjôleuse | 124 | **RÉFÉRENCE** |
| 11 | Renforts féeriques — *Invocation de fée* sans emplacement, 1×/repos long | 124 | **AUTOMATISÉ** (réserve) |
| 15 | Vagabond brumeux — *Pas brumeux* sans emplacement, SAG fois | 124 | **AUTOMATISÉ** (réserve) |

## Traqueur des ténèbres

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Embuscade redoutable — Frappe redoutable 2d6, SAG fois, repos long | 124 | **AUTOMATISÉ** (réserve) |
| 3 | Embuscade redoutable — +3 m au premier tour, SAG à l'initiative | 124 | **RÉFÉRENCE** |
| 3 | Sorts du traqueur (3/5/9/13/17) | 125 | **AUTOMATISÉ** |
| 3 | Vision ombrale | 125 | **RÉFÉRENCE** |
| 7 | Esprit de fer | 125 | **RÉFÉRENCE** |
| 11 | Rafale du traqueur — 2d8, Frappe soudaine ou Terreur de masse | 125 | **RÉFÉRENCE** |
| 15 | Esquive ombreuse | 125 | **RÉFÉRENCE** |

---

## Corrections apportées par cette lecture

1. **Tactique défensive portait les règles de 2014.** Le fichier
   `content/ranger-hunter-options.ts` s'en méfiait dans un commentaire sans
   pouvoir trancher. Le livre tranche : « Défense contre les attaques
   multiples » n'accorde plus **+4 CA** — l'assaillant subit le désavantage
   sur ses autres attaques du tour. Et **« Bond du chasseur » n'existe pas** :
   troisième option retirée.
2. **Infatigable n'avait qu'un de ses deux effets.** Le cran d'épuisement au
   repos court était appliqué ; la réserve de PV temporaires (1d8 + Sagesse,
   Sagesse fois par repos long) n'existait nulle part.
3. **Quatre réserves d'archétype manquaient** à la dérivation : Frappe
   redoutable, Renforts féeriques, Vagabond brumeux — plus Infatigable.
4. **Le Chasseur n'avait aucun moyen de choisir** sa Proie ni sa Tactique.

## Vérifié conforme, sans changement

La table d'Ennemi juré (2/3/4/5/6), la table de sorts préparés, les sorts
toujours préparés du Vagabond féerique et du Traqueur des ténèbres, les trois
blocs du Compagnon primordial (PV, CA, dégâts, traits, capacités de niveau 7,
11 et 15), et les noms et niveaux des capacités des quatre archétypes.
