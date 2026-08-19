> **Correctif au périmètre annoncé initialement.** Sur la base d'une lecture du
> seul texte source, `src/content` et `src/domain` avaient été qualifiés de
> « réutilisables tels quels ». C'était faux pour deux fichiers, découvert
> seulement en rejouant réellement les tests : la chaîne de plugins Vite ne
> patche pas qu'`App.jsx`, elle cible aussi certains fichiers de `content` et
> `domain` directement (leur `transform()` filtre sur `id`, jusqu'à
> `/src/content/spells.js` ou `/src/domain/wild-shape.ts` explicitement).
> `src/content/spells.js` (9 plugins, dont la correction de portée du sort
> mineur *Coup de tonnerre* : `9 m` → `Personnelle (émanation de 1,50 m)`) et
> `src/domain/wild-shape.ts` (`table-connectee-druid-canonical-wild-shape` :
> durée de Forme sauvage, sorts castables en forme de bête au niveau 18, bonus
> de touche des attaques naturelles) ont donc été reconstruits en rejouant la
> chaîne de 60 plugins sur le texte source, puis vérifiés par les 340 tests
> repris — pas copiés bruts. Les 53 autres fichiers de `content`/`domain`
> n'étaient touchés par aucun plugin ; eux ont bien été copiés tels quels.
> Leçon retenue pour la suite : ne plus jamais faire confiance à une lecture
> de source seule, même pour ce qui semblait déjà « propre ».

# Ce qui reste à repêcher dans `table-connectee`

Deux catégories de dette héritée de l'ancienne app, à traiter au fil de la
construction du moteur de règles — rien de tout ça n'a été copié tel quel.

## 1. Tables encore prisonnières d'`App.jsx`

`App.jsx` n'exporte rien : ces tables n'existent que comme constantes locales,
réécrites à la compilation par la chaîne de plugins. Il faudra les rejouer
(comme le faisaient les anciens tests d'audit, voir §2) pour connaître leur
état réel avant de les porter en données pures et dérivées.

Relevé par sondage sur les déclarations `const` de premier niveau (liste non
exhaustive — il y en a d'autres imbriquées dans les composants) :

- **Emplacements et magie** : `SLOTS_FULL`, `SLOTS_HALF`, `PACT`,
  `CANTRIPS_BASE`, `THIRD_CASTER_PREPARED`, `PREPARED`,
  `SUBCLASS_ALWAYS_SPELLS`, `CLASS_ALWAYS_SPELLS`, `TERRAIN_ALWAYS_SPELLS`
- **Classes et sous-classes** : `CLASS_FEATURES`, `CLASS_FEATURE_DESCRIPTIONS`,
  `CLASS_RESOURCES`, `SUBCLASS_RESOURCES`, `SUBCLASSES`,
  `SUBCLASS_PROFICIENCIES`, `SUBCLASS_SRC`, `CLASS_CHOICES`, `CLASS_CODE`
- **Combat** : `MASTERIES`, `WEAPONS`, `WEAPON_PRICES`, `COMBAT_ACTIONS`,
  `FIGHTING_STYLES`, `RANGER_FIGHTING_STYLES`, `DRUIDIC_WARRIOR`,
  `BATTLE_MASTER_MANEUVERS`, `METAMAGIC`, `DIVINE_ORDER`, `PRIMAL_ORDER`,
  `BLESSED_STRIKES`, `ELEMENTAL_FURY`, `HUNTER_PREY`, `HUNTER_DEFENSE`
- **Équipement et vie de camp** : `ARMORS`, `ARMOR_PRICES`, `ARMOR_PROF`,
  `SHIELD_CATALOG`, `SHOP_CATALOG`, `STARTING_KITS`,
  `STARTING_WEAPON_ALIASES`, `MOUNT_CREATURE_IDS`, `CRAFT_TOOL_ITEM_ID`,
  `CRAFT_IDS_BY_TOOL`, `FAST_CRAFT_IDS_BY_TOOL`, `ARTISAN_TOOLS`,
  `ARTISAN_TOOL_OPTIONS`, `FAST_CRAFT_TOOLS`, `MUSICAL_INSTRUMENTS`,
  `GAMING_SETS`, `OTHER_TOOLS`, `ALL_TOOL_PROFICIENCIES`
- **Création de personnage** : `SPECIES`, `CLASSES`, `BACKGROUNDS`, `FEATS`,
  `FEAT_ENERGY_TYPES`, `FEAT_ELEMENTAL_TYPES`, `KNOWLEDGE_SKILLS`,
  `OBSERVANT_SKILLS`, `SKILLS`, `ABIL`, `ABIL_ORDER`, `ALIGNMENTS`,
  `STANDARD_ARRAY`, `STANDARD_LANGUAGES`, `WILD_HEART_ASPECTS`
- **Règles génériques** : `CONDITIONS`, `DAMAGE_TYPES`, `SCHOOLS`, `RECHARGE`,
  `AUTOMATION`
- **Campagne** : `INITIAL_PARTY`, `INITIAL_JOURNAL`, `SCENES`, `PORTRAITS`

## 2. Règles couvertes par des tests d'audit non repris

Six fichiers de `src/domain/*.test.ts` ne testaient pas un module portable :
ils rejouaient la chaîne de plugins sur `App.jsx` et vérifiaient le texte
produit. Non copiés ici (ils dépendent de `vite.config.ts` et d'`App.jsx`),
mais leur intention documente des règles réelles à retrouver et re-couvrir
par de vrais tests du moteur :

| Fichier d'origine | Règle vérifiée |
|---|---|
| `druid-core-2024.test.ts` | Tronc commun druide, PHB §2–§8. Contenait un vrai bug : le texte affiché au joueur disait « maîtrise en Arcanes » alors que le moteur appliquait un bonus de Sagesse. |
| `druid-circles-2024.test.ts` | Cercles druidiques, PHB §9 et §12 — texte de capacité tel que reçu après plugins. |
| `stars-sea-moon-warlock-2024.test.ts` | Cercle des Étoiles/de la Mer/de la Lune (druide) et Patron Archifée (occultiste), PHB §6, §10–§12, §20 — capacités qui se déclenchent chaque round dès les niveaux 3 à 6. |
| `ranger-druidic-warrior.test.ts` | Guerrier druidique, PHB §13 — alternative au don de Style de combat pour le Rôdeur. |
| `always-prepared-2024.test.ts` | Sorts toujours préparés, PHB §1. |
| `spell-quota-granted.test.ts` | Un sort *accordé* (par la classe, la sous-classe, un don, l'espèce) doit s'ajouter au budget de sorts, pas le consommer — bug réel : un Druide du Cercle de la Terre affichait « Liste 9/6 » sans enfreindre aucune règle. |

Un septième fichier (`modal-overlay-position.test.ts`) n'est pas une règle
mais un bug d'interface (positionnement CSS des modales par-dessus le
contenu joueur, bloquant la montée de niveau) : à ne pas reproduire dans les
futurs écrans, pas à porter dans le moteur.

## 3. Extractions faites — `src/domain/spellcasting-progression.ts`

Première extraction réelle de tables d'`App.jsx` (`SLOTS_FULL`, `SLOTS_HALF`,
`PACT`, `CANTRIPS_BASE`), avec vérification indépendante contre le PHB 2024
(pas seulement rejouées via les plugins — aucun plugin ne les touchait) :

- **Emplacements de sort** (lanceurs complets, lanceurs partiels, Magie du
  Pacte) et **sorts mineurs connus** : vérifiés, portés tels quels.
  Confirmation notable au passage : les lanceurs partiels (Paladin, Rôdeur)
  gagnent la Magie dès le niveau 1 en 2024 (2 emplacements de rang 1), pas au
  niveau 2 comme en 2014 — la table de l'ancienne app avait déjà le bon
  décalage.
- **Grimoire du Magicien** (`6 + 2×(niveau-1)`) : vérifié, inchangé depuis 2014.
- **Sorts préparés (Clerc, Druide, Paladin, Magicien) — bug de fond corrigé.**
  L'ancienne table `PREPARED` plafonnait ce nombre par une table figée par
  niveau, sans jamais lire le modificateur de caractéristique du personnage.
  Or c'est la règle de base, inchangée depuis 2014 : *sorts préparés =
  modificateur d'incantation + niveau de classe (minimum 1)*. Deux Druides de
  même niveau mais de Sagesse différente n'ont pas le même nombre de sorts
  préparés — la table de l'ancienne app ne pouvait pas le représenter. Elle
  n'a pas été reportée ; `preparedSpellCount(modificateur, niveau)` calcule
  maintenant la vraie valeur.
- **Sorts connus (Barde, Ensorceleur, Occultiste, Rôdeur)** : l'Occultiste est
  vérifié indépendamment (table Magie occulte, inchangée depuis 2014). Le
  Rôdeur est repris tel quel de l'ancienne app — cohérent avec le décalage
  2024 ci-dessus, mais pas revérifié terme à terme contre le PHB papier.
  Barde et Ensorceleur n'ont **pas** été repris : dans l'ancienne app, leurs
  lignes étaient structurellement identiques à celles de Clerc/Druide (une
  seule table `PREPARED` pour les quatre), ce qui n'a pas de sens pour des
  classes à sorts *connus* — signe que la table source mélangeait déjà les
  deux mécaniques. Comme aucun de tes joueurs actuels ne joue barde ou
  ensorceleur, mieux vaut les laisser à `null` (avec un test qui le vérifie)
  que copier une valeur suspecte.

## 4. Extractions faites — bonus de maîtrise et ressources du Rôdeur

- `src/domain/proficiency.ts` : bonus de maîtrise par niveau, vérifié,
  inchangé depuis 2014. Repêché d'une fonction locale d'`App.jsx`
  (`profByLevel`) jamais exportée mais utilisée partout.
- `src/domain/ranger-resources.ts` : Marque du chasseur sans emplacement
  (= bonus de maîtrise, vérifié) et Voile de la nature (= modificateur de
  Sagesse, minimum 1, vérifié — n'existait dans aucun module portable
  auparavant).

**Bug de fond trouvé et déjà corrigé sans écrire de code** : l'Infatigable du
Rôdeur (niveau 10). `App.jsx` la plafonne par une table figée par niveau
(4 usages aux niveaux 10-12, 5 aux niveaux 13-16, 6 aux niveaux 17-20),
totalement indépendante de la Sagesse du personnage. Or la règle réelle est
*modificateur de Sagesse, minimum 1* — et `src/domain/ranger-core-2024.ts`
(déjà repêché intact à l'étape 1, `tirelessMaxUses` /
`applyRangerTirelessShortRest`) l'implémente déjà correctement, avec ses
tests. Ce code n'était simplement **câblé nulle part** dans `table-connectee`
— aucun plugin ne l'importait, aucune trace dans `App.jsx`. C'est donc du
code mort dans l'ancienne app, mais déjà juste et déjà présent dans ce
dépôt : rien à refaire, seulement à documenter et à ne pas régresser.

## 5. Résolu — le Pacte de l'Occultiste

Investigation du problème de fond que tu avais signalé (« ma joueuse
occultiste ne peut toujours pas choisir son pacte »), tranchée le 19/08/2026
sur confirmation de ta part depuis le PHB 2024 papier :

- **Pacte de la Lame, de la Chaîne, du Grimoire** : niveau 1, invocations
  occultes ordinaires. Confirmé — c'est exactement ce que contenait déjà
  `src/content/eldritch-invocations.ts` (`minLevel: 1`), repêché tel quel de
  `table-connectee`. Aucune correction nécessaire.
- **Pacte du Talisman** : n'existe pas dans le PHB 2024 (règle de
  Tasha's Cauldron of Everything / 2014, non reconduite). Confirmé —
  `table-connectee` ne le contenait déjà nulle part ; ce n'était donc pas une
  lacune mais un état correct. Verrouillé par un test qui échoue si quelqu'un
  l'ajoute par erreur un jour.
- Le niveau 3 correspond au choix de la sous-classe (patron), pas au choix du
  pacte — sans lien avec les Invocations occultes.

Le vrai problème que tu décrivais (une fiche créée avant l'arrivée d'une
fonctionnalité ne peut plus en profiter) reste de toute façon réglé par
l'architecture du nouveau projet : le pacte choisi sera une décision stockée
sur la fiche, ses effets dérivés à la lecture — ajoutable ou corrigible plus
tard sans migration.

## Comment vérifier une règle depuis l'ancien dépôt

`App.jsx` seul ne dit rien de fiable : il faut rejouer la chaîne de plugins
`table-connectee-*` de `vite.config.ts` sur son contenu et lire le résultat
construit, exactement comme le faisaient les six tests d'audit ci-dessus.
