# Druide — conformité PHB 2024

Source unique : `PlayersHandbook2024.pdf` fourni par l'utilisateur (édition
anglaise, scannée en quatre fichiers). Les pages citées sont celles imprimées
dans le livre. Aucune règle de ce document n'a été reconstituée de mémoire ;
ce qui n'a pas été lu dans le PDF porte la mention **NON VÉRIFIÉE**.

L'application est en français : les noms anglais du livre sont traduits, en
gardant les traductions déjà employées par la table.

## Classement

| état | ce que ça veut dire |
|---|---|
| **AUTOMATISÉ** | la règle agit sur une vraie `CharacterSheet`, un test de conformité le prouve |
| **ASSISTÉ** | l'app tient le compte, le joueur décide et déclare |
| **RÉFÉRENCE** | affiché pour être lu ; rien à automatiser (choix de dégâts, avantage à la table) |
| **ORPHELIN** | du code existe mais sur l'ancienne forme, il ne touche pas la fiche jouée |
| **MANQUANT** | rien |

---

## Tronc commun

| Niv. | Capacité | Page | État | Où |
|---|---|---|---|---|
| 1 | Incantation — 2 sorts mineurs, 4 sorts préparés, table 1–20 | 79-80 | **AUTOMATISÉ** | `domain/spellcasting-progression.ts` |
| 1 | Druidique — *Parler aux animaux* toujours préparé | 80 | **AUTOMATISÉ** | `content/always-prepared-spells.ts` |
| 1 | Druidique — messages cachés, DD 15 Intelligence (Investigation) | 80 | **RÉFÉRENCE** | `content/class-features.ts` |
| 1 | Ordre primordial — **Mage** : +1 sort mineur | 80 | **AUTOMATISÉ** | `model/choix-de-classe.ts` → `derive.ts` |
| 1 | Ordre primordial — **Mage** : bonus Sagesse aux tests d'Arcanes/Nature | 80 | **RÉFÉRENCE** | l'app ne modélise pas les bonus de test conditionnels |
| 1 | Ordre primordial — **Gardien** : armes de guerre, armures intermédiaires | 80 | **RÉFÉRENCE** | l'app ne dérive pas encore l'entraînement aux armures |
| 2 | Forme sauvage — 2 utilisations, +1 aux niveaux 6 et 17 | 80 | **AUTOMATISÉ** | `domain/druid-resources.ts` |
| 2 | Forme sauvage — 1 utilisation au repos court, toutes au repos long | 80 | **AUTOMATISÉ** | `model/rest.ts` |
| 2 | Forme sauvage — durée : moitié du niveau en heures | 80 | **ASSISTÉ** | `model/druide.ts` (`dureeFormeSauvageHeures`) |
| 2 | Forme sauvage — PV temporaires égaux au niveau | 81 | **AUTOMATISÉ** | `model/wild-shape.ts` + `model/damage.ts` |
| 2 | Forme sauvage — formes connues 4/6/8, FP 1/4 · 1/2 · 1, vol au niveau 8 | 81 | **AUTOMATISÉ** | `domain/wild-shape.ts` |
| 2 | Forme sauvage — échange d'une forme après un repos long | 80 | **AUTOMATISÉ** | `model/wild-shape.ts` (`swapForm`) |
| 2 | Forme sauvage — statistiques remplacées, INT/SAG/CHA conservés | 81 | **AUTOMATISÉ** | le profil ne porte que FOR/DEX/CON |
| 2 | Forme sauvage — pas d'incantation (sauf Lune 3 et Sorts en forme de bête) | 81 | **AUTOMATISÉ** | `domain/wild-shape.ts` (`canCastSpellWhileWildShaped`) |
| 2 | Forme sauvage — équipement (tombe, fusionne, ou porté) | 81 | **RÉFÉRENCE** | décision de table |
| 2 | Compagnon sauvage — emplacement **ou** utilisation de Forme sauvage | 81 | **AUTOMATISÉ** | `model/druide.ts` (`payerCompagnonSauvage`) |
| 2 | Compagnon sauvage — le familier est Fée et disparaît au repos long | 81 | **AUTOMATISÉ** | `model/companions.ts` |
| 3 | Sous-classe | 81 | **AUTOMATISÉ** | `content/subclasses.ts` |
| 4, 8, 12, 16 | Augmentation de caractéristique | 81 | **AUTOMATISÉ** | `model/level-up.ts` |
| 5 | Résurgence sauvage — emplacement → 1 Forme sauvage, 1×/tour, seulement à zéro | 81 | **AUTOMATISÉ** | `model/druide.ts` (`convertirEmplacementEnForme`) |
| 5 | Résurgence sauvage — 1 Forme sauvage → emplacement de rang 1, 1×/repos long | 81 | **AUTOMATISÉ** | `model/druide.ts` (`convertirFormeEnEmplacement`) |
| 7 | Furie élémentaire — choix Incantation puissante / Frappe primordiale | 81 | **ASSISTÉ** | décision proposée ; les dégâts se déclarent à la table |
| 15 | Furie élémentaire améliorée — portée +90 m, ou 2d8 | 81 | **RÉFÉRENCE** | `content/class-features.ts` |
| 18 | Sorts en forme de bête | 81 | **AUTOMATISÉ** | `domain/wild-shape.ts` |
| 19 | Don épique | 81 | **AUTOMATISÉ** | `model/level-up.ts` |
| 20 | Archidruide — Forme sauvage pérenne à l'Initiative | 82 | **AUTOMATISÉ** | `model/druide.ts` (`archidruideSurInitiative`) |
| 20 | Archidruide — Magicien de la nature, 2 rangs par utilisation, 1×/repos long | 82 | **AUTOMATISÉ** | `model/druide.ts` (`magicienDeLaNature`) |
| 20 | Archidruide — Longévité | 82 | **RÉFÉRENCE** | — |

## Cercle de la Terre

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Sorts du cercle — terrain choisi à chaque repos long | 84 | **AUTOMATISÉ** — `model/choix-de-classe.ts` + `content/always-prepared-spells.ts` |
| 3 | Aide de la terre — 2d6, +1d6 aux niveaux 10 et 14 | 85 | **ASSISTÉ** — dépense une Forme sauvage |
| 6 | Récupération naturelle — un sort de cercle sans emplacement, 1×/repos long | 85 | **AUTOMATISÉ** |
| 6 | Récupération naturelle — emplacements récupérés au repos court | 85 | **ASSISTÉ** — le joueur compose, l'app compte et refuse ce qui dépasse |
| 10 | Garde de la nature — immunité Empoisonné, résistance selon le terrain | 85 | **RÉFÉRENCE** |
| 14 | Sanctuaire de la nature | 86 | **RÉFÉRENCE** |

## Cercle de la Lune

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Sorts du cercle de la Lune (3/5/7/9) | 86 | **AUTOMATISÉ** |
| 3 | Formes du cercle — FP = niveau ÷ 3, CA 13 + SAG, PV temporaires ×3 | 86 | **AUTOMATISÉ** |
| 6 | Formes du cercle améliorées — Éclat lunaire, Robustesse accrue | 87 | **RÉFÉRENCE** |
| 10 | Pas de clair de lune — SAG utilisations, repos long | 87 | **AUTOMATISÉ** (réserve) |
| 10 | Pas de clair de lune — récupérer une utilisation par emplacement de rang 2+ | 87 | **MANQUANT** |
| 14 | Forme lunaire | 87 | **RÉFÉRENCE** |

## Cercle de la Mer

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Sorts du cercle de la Mer (3/5/7/9) | 87 | **AUTOMATISÉ** |
| 3 | Courroux de la mer — Forme sauvage, émanation 1,50 m, 10 min, SAG d6 | 87 | **MANQUANT** |
| 6 | Affinité aquatique — émanation 3 m, nage | 87 | **RÉFÉRENCE** |
| 10 | Né de la tempête — vol, résistances froid/foudre/tonnerre | 87 | **RÉFÉRENCE** |
| 14 | Don océanique | 88 | **RÉFÉRENCE** |

## Cercle des Étoiles

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Carte stellaire — Assistance et Trait guidé préparés | 88 | **AUTOMATISÉ** |
| 3 | Carte stellaire — Trait guidé sans emplacement, SAG fois, repos long | 88 | **AUTOMATISÉ** (réserve) |
| 3 | Forme stellaire — Forme sauvage, 10 min, constellation au choix | 88-89 | **MANQUANT** |
| 6 | Présage cosmique — SAG réactions, repos long, Faste/Néfaste au repos long | 89 | **AUTOMATISÉ** (réserve) |
| 10 | Constellations scintillantes | 89 | **RÉFÉRENCE** |
| 14 | Plein d'étoiles | 89 | **RÉFÉRENCE** |

---

## Corrections apportées par cette lecture

1. **Les décisions de classe n'étaient demandées nulle part.** `content/class-choices.ts`
   portait Ordre primordial et Furie élémentaire depuis le début sans être importé
   par personne. Conséquence : un Druide du Cercle de la Terre n'avait aucun moyen
   de choisir son terrain, donc **aucun sort de cercle, jamais** — alors que la
   dérivation savait déjà les accorder.
2. **Les formes volantes et de FP 1 n'existaient pas.** `WILD_SHAPE_PROFILES`
   couvrait les seules bêtes d'un Druide de niveau 2 à 5. Dix profils ajoutés
   depuis l'appendice B (p. 346-359) : Chauve-souris, Faucon, Chouette, Corbeau,
   Ours brun, Loup sanguinaire, Araignée géante, Lion, Tigre, Éléphant.
3. **Magicien de la nature** (Archidruide) n'était qu'un texte.
4. Un commentaire de `domain/druid-resources.ts` décrivait Résurgence sauvage
   avec la règle de Forme sauvage pérenne.

## Vérifié conforme, sans changement

Les tables de `domain/wild-shape.ts` (formes connues, FP, vol, PV temporaires,
CA du Cercle de la Lune, incantation en forme), les sorts toujours préparés des
quatre cercles et des quatre terrains, la table de progression du Druide, et
les blocs de créatures de `content/creatures.ts` correspondent au livre.

---

## Liste de sorts du Druide (p. 82-84)

Décomptée rang par rang contre les tables du livre. Deux erreurs trouvées, et
deux doublons du catalogue.

| Rang | Livre | Application, avant | Après |
|---|---|---|---|
| 0 | 13 | 13 | 13 |
| 1 | 18 | **17** — Charme-personne manquait | 18 |
| 2 | 23 | 23 | 23 |
| 3 | 17 | 17 | 17 |
| 4 | 21 | 21 | 21 |
| 5 | 15 | **16** — Rappel à la vie en trop | 15 |
| 6 | 10 | 10 | 10 |
| 7 | 6 | 6 | 6 |
| 8 | 8 | 8 | 8 |
| 9 | 4 | 4 | 4 |

Les listes du **Rôdeur** (p. 120-122 : 14, 18, 16, 7, 6) et de l'**Occultiste**
(p. 156-158 : 12, 15, 12, 14, 6, 9) correspondaient déjà au livre, une fois les
deux doublons retirés.
