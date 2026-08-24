# Occultiste — conformité PHB 2024

Source unique : `PlayersHandbook2024.pdf` fourni par l'utilisateur. Pages
imprimées du livre. Rien n'a été reconstitué de mémoire.

## Tronc commun

| Niv. | Capacité | Page | État | Où |
|---|---|---|---|---|
| 1 | Magie de pacte — emplacements, rang, tous rendus au repos **court** | 154 | **AUTOMATISÉ** | `domain/spellcasting-progression.ts`, `model/rest.ts` |
| 1 | Invocations occultes — 1, puis 3, 5, 6, 7, 8, 9, 10 | 154 | **AUTOMATISÉ** | `content/eldritch-invocations.ts` + `model/invocations.ts` |
| 2 | Ruse magique — `ceil(max/2)` emplacements, 1×/repos long | 154 | **AUTOMATISÉ** | `model/occultiste.ts` |
| 3 | Patron | 154 | **AUTOMATISÉ** | `content/subclasses.ts` |
| 4, 8, 12, 16 | Augmentation de caractéristique | 154 | **AUTOMATISÉ** | `model/level-up.ts` |
| 9 | Contact du patron — *Contact avec un autre plan* toujours préparé | 155 | **AUTOMATISÉ** | `content/always-prepared-spells.ts` |
| 9 | Contact du patron — un lancement gratuit par repos long | 155 | **AUTOMATISÉ** (réserve) |
| 11, 13, 15, 17 | Arcanum mystique — rangs 6, 7, 8, 9 | 155 | **AUTOMATISÉ** | `model/invocations.ts` |
| 19 | Don épique | 155 | **AUTOMATISÉ** |
| 20 | Maître occulte — Ruse magique rend TOUT | 155 | **AUTOMATISÉ** | `model/occultiste.ts` |

## Invocations occultes

Les **28** invocations du livre (p. 155-157) sont présentes, avec le bon niveau
minimum et le bon prérequis d'invocation — vérifié une par une. Six exigent une
autre invocation : Lame dévorante (Lame assoiffée), Châtiment occulte, Buveuse
de vie et Lame assoiffée (Pacte de la Lame), Don des protecteurs (Pacte du
Grimoire), Investissement du maître de la Chaîne (Pacte de la Chaîne).

Le choix, le complément dû au niveau et le remplacement sont proposés à la
montée de niveau. Une invocation qui sert de prérequis ne peut pas être retirée.

## Patron Archifée

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Sorts de l'Archifée (3/5/7/9) | 158 | **AUTOMATISÉ** |
| 3 | Pas des fées — *Pas brumeux* sans emplacement, CHA fois, repos long | 158 | **AUTOMATISÉ** (réserve) |
| 3 | Pas des fées — effet additionnel choisi à chaque lancement | 158 | **RÉFÉRENCE** |
| 6 | Fuite brumeuse | 158 | **RÉFÉRENCE** |
| 10 | Défenses enjôleuses — réaction, 1×/repos long ou un emplacement de pacte | 158 | **AUTOMATISÉ** (réserve) |
| 14 | Magie envoûtante | 159 | **RÉFÉRENCE** |

## Patron Céleste

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Sorts célestes (3/5/7/9) | 159 | **AUTOMATISÉ** |
| 3 | Lumière guérisseuse — 1 + niveau d6, CHA dés par usage | 159 | **AUTOMATISÉ** | 
| 6 | Âme radiante | 159 | **RÉFÉRENCE** |
| 10 | Résilience céleste — Ruse magique, repos court, repos long | 160 | **AUTOMATISÉ** |
| 14 | Vengeance brûlante — 1×/repos long | 160 | **AUTOMATISÉ** (réserve) |

## Patron Fiélon

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Bénédiction du Ténébreux — CHA + niveau PV temporaires, minimum 1 | 160 | **AUTOMATISÉ** |
| 3 | Sorts fiélons (3/5/7/9) | 160 | **AUTOMATISÉ** |
| 6 | Chance du Ténébreux — 1d10, CHA fois, repos long | 161 | **AUTOMATISÉ** (réserve) |
| 10 | Résilience fiélonne — un type de dégâts à chaque repos | 161 | **ASSISTÉ** — décision proposée |
| 14 | Précipiter dans les Enfers — 1×/repos long ou un emplacement de pacte | 161 | **AUTOMATISÉ** (réserve) |

## Patron Grand Ancien

| Niv. | Capacité | Page | État |
|---|---|---|---|
| 3 | Esprit éveillé | 161-162 | **RÉFÉRENCE** |
| 3 | Sorts du Grand Ancien (3/5/7/9) | 162 | **AUTOMATISÉ** |
| 3 | Sorts psychiques | 162 | **RÉFÉRENCE** |
| 6 | Combattant clairvoyant — 1×/repos **court** ou un emplacement de pacte | 162 | **AUTOMATISÉ** (réserve) |
| 10 | Maléfice occulte — *Maléfice* toujours préparé | 162 | **AUTOMATISÉ** |
| 10 | Bouclier mental | 162 | **RÉFÉRENCE** |
| 14 | Création d'un serviteur | 162 | **RÉFÉRENCE** |

---

## Corrections apportées par cette lecture

Quatre réserves d'une utilisation par repos long n'étaient déclarées nulle
part — donc jamais affichées, jamais dépensées, jamais rendues : Contact du
patron, Défenses enjôleuses, Vengeance brûlante, Précipiter dans les Enfers.

Résilience fiélonne n'avait aucun moyen d'être choisie.

## Vérifié conforme, sans changement

C'est la classe la mieux tenue des trois. Correspondent exactement au livre :
la table complète (invocations, sorts mineurs, sorts préparés, emplacements de
pacte et leur rang, aux vingt niveaux), les **28** invocations avec leurs
prérequis, les quatre tables de sorts de patron, Lumière guérisseuse,
Résilience céleste, Bénédiction du Ténébreux, Chance du Ténébreux, Pas des
fées, et Combattant clairvoyant — y compris le fait qu'il revienne au repos
court quand les autres attendent le repos long.
