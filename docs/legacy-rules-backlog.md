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
exhaustive — il y en a d'autres imbriquées dans les composants). ✅ = extrait
(détail dans les sections numérotées plus bas) :

- **Emplacements et magie** : ✅ `SLOTS_FULL`, ✅ `SLOTS_HALF`, ✅ `PACT`,
  ✅ `CANTRIPS_BASE`, `THIRD_CASTER_PREPARED` (pas nos classes), ✅ `PREPARED`
  (corrigée, cf. §3), `SUBCLASS_ALWAYS_SPELLS`, `CLASS_ALWAYS_SPELLS`,
  `TERRAIN_ALWAYS_SPELLS`
- **Classes et sous-classes** : `CLASS_FEATURES`, `CLASS_FEATURE_DESCRIPTIONS`,
  ✅ `CLASS_RESOURCES` (druide/rôdeur/occultiste), ✅ `SUBCLASS_RESOURCES`
  (patrons occultiste), `SUBCLASSES`, `SUBCLASS_PROFICIENCIES`,
  `SUBCLASS_SRC`, `CLASS_CHOICES`, `CLASS_CODE`
- **Combat** : ✅ `MASTERIES`, ✅ `WEAPONS`, ✅ `WEAPON_PRICES`, `COMBAT_ACTIONS`,
  ✅ `FIGHTING_STYLES`, ✅ `RANGER_FIGHTING_STYLES`, ✅ `DRUIDIC_WARRIOR`,
  `BATTLE_MASTER_MANEUVERS`, `METAMAGIC`, `DIVINE_ORDER`, `PRIMAL_ORDER`,
  `BLESSED_STRIKES`, `ELEMENTAL_FURY`, ✅ `HUNTER_PREY`, ✅ `HUNTER_DEFENSE`
- **Équipement et vie de camp** : ✅ `ARMORS`, ✅ `ARMOR_PRICES`, `ARMOR_PROF`,
  ✅ `SHIELD_CATALOG` (portée en version simplifiée, cf. §4sexto),
  `SHOP_CATALOG`, `STARTING_KITS`,
  `STARTING_WEAPON_ALIASES`, `MOUNT_CREATURE_IDS`, `CRAFT_TOOL_ITEM_ID`,
  `CRAFT_IDS_BY_TOOL`, `FAST_CRAFT_IDS_BY_TOOL`, `ARTISAN_TOOLS`,
  `ARTISAN_TOOL_OPTIONS`, `FAST_CRAFT_TOOLS`, `MUSICAL_INSTRUMENTS`,
  `GAMING_SETS`, `OTHER_TOOLS`, `ALL_TOOL_PROFICIENCIES`
- **Création de personnage** : ✅ `SPECIES`, `CLASSES`, `BACKGROUNDS`, `FEATS`,
  `FEAT_ENERGY_TYPES`, `FEAT_ELEMENTAL_TYPES`, `KNOWLEDGE_SKILLS`,
  `OBSERVANT_SKILLS`, ✅ `SKILLS`, ✅ `ABIL`, ✅ `ABIL_ORDER`, ✅ `ALIGNMENTS`,
  ✅ `STANDARD_ARRAY`, ✅ `STANDARD_LANGUAGES`, `WILD_HEART_ASPECTS`
- **Règles génériques** : ✅ `CONDITIONS` (les 14 états officiels ; les
  étiquettes de suivi supplémentaires de la table d'origine restent à
  traiter au niveau du modèle de personnage, pas comme règles à part),
  ✅ `DAMAGE_TYPES`, ✅ `SCHOOLS`, ✅ `RECHARGE`, `AUTOMATION`
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

## 4septo. Extractions faites — espèces et petites tables génériques

- `src/content/reference-lists.ts` — treize types de dégâts, huit écoles de
  magie. Confiance haute, listes standard inchangées depuis 2014.
- `src/domain/recharge.ts` — vocabulaire interne de recharge des ressources
  (pas une règle du PHB, juste un type partagé au lieu de chaînes libres).
- `src/content/species.ts` — les dix espèces du PHB 2024, avec leurs
  lignages (Elfe, Gnome, Tieffelin) et ascendances (Drakéide, Goliath).
  Confiance haute mais pas confirmée page à page : cohérent avec la refonte
  2024 que je connais (résistances liées à l'ascendance/au legs, Forme
  imposante du Goliath au niveau 5, don d'origine supplémentaire pour
  l'Humain), sur dix entrées un détail isolé peut m'avoir échappé.
- `src/domain/species-resources.ts` — ressources dérivées de l'espèce
  choisie (Souffle draconique, Mains guérisseuses, Ténacité implacable…),
  avec une simplification assumée : le nom de la « Magie innée » utilise
  l'id du sort plutôt que sa recherche dans `SPELLS`, pour ne pas coupler ce
  module au contenu des sorts — à la charge de l'affichage de résoudre le
  nom lisible.

## 4sexto. Extractions faites — armes et armures (SRD 5.2)

- `src/content/weapons.ts` — trente-huit armes avec dégâts, propriétés et
  maîtrise PHB 2024 (correction au passage : le décompte annoncé
  initialement dans ce backlog disait « 37 », c'était une erreur
  arithmétique de ma part en recopiant — 38 dans le code d'origine comme
  ici). Les huit maîtrises correspondent exactement au type déjà posé dans
  `src/domain/weapon-mastery.ts`.
- `src/content/armor.ts` — treize armures (Sans armure incluse), plafonds de
  Dextérité, temps pour enfiler/retirer par catégorie (vérifié PHB 2024 :
  légère 1 min/1 min, intermédiaire 5 min/1 min, lourde 10 min/5 min), et
  `armorClassFor()` qui calcule la CA effective au lieu de stocker un plafond
  déjà appliqué.
- Confiance haute pour l'ensemble : données du SRD 5.2 (licence CC-BY 4.0),
  stables depuis 2014, revérifiées contre mes connaissances des tables
  officielles.
- Volontairement pas repris : `SHOP_CATALOG`/`WEAPON_CATALOG`/`ARMOR_CATALOG`
  (mise en forme pour l'affichage boutique, pas une règle), `ARMOR_PROF`
  (maîtrises d'armure par classe, à traiter avec `SUBCLASS_PROFICIENCIES`).

## 4quinto. Extractions faites — bases de personnage et états officiels

- `src/content/character-basics.ts` — caractéristiques, tableau standard,
  langues standard (dont l'ajout 2024, Langue des signes commune),
  alignements, dix-huit compétences avec leur caractéristique. Confiance
  haute : listes standard, inchangées depuis la sortie du PHB 2024.
- `src/domain/conditions.ts` — les 14 états officiels (l'Épuisement est un
  compteur numérique à part, déjà noté dans `rules-compendium.ts`).
  Confiance haute pour l'ensemble. Une exception marquée dans le fichier :
  Agrippé y désavantage les attaques contre une cible autre que
  l'agrippeur, un effet que je ne retrouve pas dans la règle officielle
  (qui se limite à réduire la vitesse à 0) — porté tel quel avec
  l'avertissement, probablement un ajout maison délibéré plutôt qu'une
  erreur, à trancher si ça devient gênant en jeu.

## 4quater. Extractions faites — styles de combat et sous-classe Chasseur (Rôdeur)

- `src/content/fighting-styles.ts` — les dix options du don de Style de
  combat (2024 : c'est un don, pas une capacité de classe), plus le
  Guerrier druidique, alternative réservée au Rôdeur. Confiance haute :
  liste standard, inchangée depuis la sortie du PHB 2024.
- `src/content/ranger-hunter-options.ts` — Proie du chasseur (niveau 3,
  deux options) et Tactiques défensives (niveau 7, trois options) de la
  sous-classe Chasseur. **Confiance modérée, pas confirmée page à page.** En
  2014, Proie du chasseur avait une troisième option (Tueur de géants) et
  Tactiques défensives une troisième option différente (Volonté de fer) qui
  n'apparaissent pas ici. Soit le PHB 2024 a réduit ces choix, soit il en
  manque une — à vérifier si un jour un Rôdeur de la table choisit le
  Chasseur (c'était la sous-classe par défaut de l'ancienne app, donc
  plausible).

## 4ter. Extractions faites — les quatre Patrons de l'Occultiste

`src/domain/warlock-patron-resources.ts` — ressource propre à chaque patron
(Céleste, Fiélon, Grand Ancien, Archifée), repêchées de
`SUBCLASS_RESOURCES`. **Pas encore confrontées page à page au PHB 2024
papier**, contrairement au reste de cette section — à vérifier si tu joues
un jour un patron autre que ceux déjà couverts ailleurs. Confiance par
capacité :

- **Fiélon** (Chance du Ténébreux, modificateur de Charisme minimum 1) :
  motif identique à des capacités déjà vérifiées (Voile de la nature du
  Rôdeur) et correspond à la règle connue *Dark One's Own Luck* — confiance
  haute.
- **Grand Ancien** et **Archifée** (Combattant clairvoyant, Pas des fées) :
  leur table suit exactement le bonus de maîtrise à partir de leur niveau
  d'entrée — motif interne cohérent, mais je ne connais pas ces deux
  capacités avec assez de certitude pour confirmer le nom exact ou l'effet
  complet. Portées telles quelles.
- **Céleste** (Lumière guérisseuse, niveau + 1 dés) : motif simple et
  plausible, non confirmé.

Note au passage : le Rôdeur Vagabond féerique a *aussi* une capacité
appelée « Pas des fées » (niveau 11, modificateur de Sagesse) — même nom
français, mécanique différente de celle de l'Archifée. Les deux sont
distinguées dans le code.

## 4bis. Extractions faites — Forme sauvage et Ruse magique (deux faux positifs)

Deux tables que je pensais suspectes, vérifiées le 19/08/2026 contre le PHB
2024 papier de l'utilisateur — **les deux étaient déjà correctes dans
`table-connectee`**, portées telles quelles sans aucune correction :

- `src/domain/druid-resources.ts` — Forme sauvage : 2 utilisations aux
  niveaux 2-5, 3 aux niveaux 6-16, 4 aux niveaux 17-20 (paliers confirmés).
  Résurgence sauvage à partir du niveau 5.
- `src/domain/warlock-resources.ts` — Ruse magique (niveau 2) : après un
  rituel d'une minute, récupère au maximum la moitié (arrondie au supérieur)
  de son nombre maximal d'emplacements de Magie de pacte, une fois par repos
  long. Maître occulte (niveau 20) transforme cette récupération en totale.
  Confirmation utile au passage : le niveau 9 de l'Occultiste est *Contact du
  Patron*, sans lien avec Ruse magique — mon hypothèse de décalage de niveau
  était fausse.

Une vérification papier peut donc aussi bien *infirmer* une inquiétude que la
confirmer — les deux sont un résultat utile de l'audit, pas seulement les bugs.

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
