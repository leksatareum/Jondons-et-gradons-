/**
 * Capacités de classe par niveau, et leur description opérationnelle.
 *
 * ⚠️ Repêché de la SORTIE CONSTRUITE de `table-connectee/src/App.jsx`
 * (`CLASS_FEATURES`, `CLASS_FEATURE_DESCRIPTIONS`) : la chaîne de plugins
 * réécrit ces deux tables, le texte source n'est donc pas fiable ici.
 * Littéraux évalués depuis la sortie construite, jamais recopiés à la main.
 *
 * Ce sont les capacités du tronc commun de chaque classe. Celles des
 * sous-classes vivent dans `subclasses.ts` ; les ressources chiffrées
 * qu'elles consomment vivent dans les modules `*-resources.ts` du domaine.
 */

/** Capacités gagnées à chaque niveau, par classe. */
export const CLASS_FEATURES: Record<string, Record<number, string[]>> = {
  barbare: {
    2: ['Instinct du danger', 'Attaque téméraire'],
    3: ['Savoir primitif'],
    5: ['Attaque supplémentaire', 'Déplacement rapide'],
    7: ['Instinct farouche', 'Bond instinctif'],
    9: ['Frappe brutale'],
    11: ['Rage tenace'],
    13: ['Frappe brutale améliorée'],
    15: ['Rage persistante'],
    17: ['Frappe brutale supérieure'],
    18: ['Puissance indomptable'],
    20: ['Champion primordial'],
  },
  barde: {
    2: ['Expertise', 'Touche-à-tout'],
    5: ['Source d\'inspiration'],
    7: ['Contre-charme'],
    9: ['Expertise'],
    10: ['Secrets magiques'],
    18: ['Inspiration supérieure'],
    20: ['Mots de création'],
  },
  clerc: {
    2: ['Conduit divin'],
    5: ['Flétrissure des morts-vivants'],
    7: ['Frappes bénies'],
    10: ['Intervention divine'],
    14: ['Frappes bénies améliorées'],
    20: ['Intervention divine majeure'],
  },
  druide: {
    2: ['Forme sauvage', 'Compagnon sauvage'],
    5: ['Résurgence sauvage'],
    7: ['Furie élémentaire'],
    15: ['Furie élémentaire améliorée'],
    18: ['Sorts en forme de bête'],
    19: ['Don épique'],
    20: ['Archidruide'],
  },
  guerrier: {
    2: ['Fougue guerrière', 'Esprit tactique'],
    5: ['Attaque supplémentaire', 'Repli tactique'],
    9: ['Indomptable', 'Maître tactique'],
    11: ['Deux attaques supplémentaires'],
    13: ['Attaques étudiées'],
    17: ['Fougue guerrière : deux usages'],
    20: ['Trois attaques supplémentaires'],
  },
  moine: {
    2: ['Concentration du moine', 'Métabolisme surnaturel', 'Déplacement sans armure'],
    3: ['Parade'],
    4: ['Chute ralentie'],
    5: ['Attaque supplémentaire', 'Frappe étourdissante'],
    6: ['Frappes renforcées'],
    7: ['Évasion'],
    9: ['Déplacement acrobatique'],
    10: ['Concentration accrue', 'Restauration personnelle'],
    13: ['Déviation d\'énergie'],
    14: ['Survivant discipliné'],
    15: ['Concentration parfaite'],
    18: ['Défense supérieure'],
    20: ['Corps et esprit'],
  },
  paladin: {
    2: ['Style de combat', 'Châtiment du paladin'],
    3: ['Conduit divin'],
    5: ['Attaque supplémentaire', 'Destrier fidèle'],
    6: ['Aura de protection'],
    9: ['Abjuration des ennemis'],
    10: ['Aura de courage'],
    11: ['Frappes radiantes'],
    14: ['Toucher restaurateur'],
    18: ['Auras étendues'],
  },
  rodeur: {
    2: ['Explorateur agile', 'Style de combat'],
    5: ['Attaque supplémentaire'],
    6: ['Vagabond'],
    9: ['Expertise'],
    10: ['Infatigable'],
    13: ['Chasseur implacable'],
    14: ['Voile de la nature'],
    17: ['Chasseur précis'],
    18: ['Sens farouches'],
    19: ['Don épique'],
    20: ['Tueur d\'ennemis'],
  },
  roublard: {
    2: ['Ruse'],
    3: ['Visée assurée'],
    5: ['Frappe rusée', 'Esquive instinctive'],
    6: ['Expertise'],
    7: ['Évasion', 'Talent fiable'],
    11: ['Frappe rusée améliorée'],
    14: ['Frappes sournoises'],
    15: ['Esprit insaisissable'],
    18: ['Insaisissable'],
    20: ['Coup de chance'],
  },
  ensorceleur: {
    2: ['Source de magie', 'Métamagie'],
    5: ['Restauration sorcelière'],
    7: ['Sorcellerie incarnée'],
    20: ['Apothéose arcanique'],
  },
  occultiste: {
    2: ['Ruse magique'],
    9: ['Contact du Patron'],
    11: ['Arcane mystique (niveau 6)'],
    13: ['Arcane mystique (niveau 7)'],
    15: ['Arcane mystique (niveau 8)'],
    17: ['Arcane mystique (niveau 9)'],
    19: ['Don épique'],
    20: ['Maître occulte'],
  },
  magicien: {
    2: ['Érudit'],
    5: ['Mémoriser un sort'],
    18: ['Maîtrise des sorts'],
    20: ['Sorts de prédilection'],
  },
};

/** Description opérationnelle d'une capacité, indexée par son nom exact. */
export const CLASS_FEATURE_DESCRIPTIONS: Record<string, string> = {
  'Instinct du danger':
    'Avantage aux sauvegardes de Dextérité tant que tu n’es pas Incapable d’agir.',
  'Attaque téméraire':
    'À ta première attaque du tour fondée sur la Force, tu peux obtenir l’avantage sur toutes ces attaques du tour ; les attaques contre toi ont ensuite l’avantage jusqu’au début de ton prochain tour.',
  'Savoir primitif':
    'Gagne une compétence de Barbare. Tant que Rage est active, certains tests physiques ou instinctifs peuvent employer la Force à la place de leur caractéristique normale.',
  'Attaque supplémentaire':
    'Tu effectues deux attaques, au lieu d’une, lorsque tu entreprends l’action Attaquer.',
  'Déplacement rapide':
    'Ta vitesse augmente de 3 m tant que tu ne portes pas d’armure lourde.',
  'Instinct farouche':
    'Avantage à l’initiative. Si tu es surpris au début d’un combat, activer Rage te permet d’agir normalement à ton premier tour.',
  'Bond instinctif':
    'Quand Rage s’active, déplace-toi jusqu’à la moitié de ta vitesse sans provoquer d’attaques d’opportunité.',
  'Frappe brutale':
    'Avec Attaque téméraire, renonce à l’avantage d’une attaque fondée sur la Force pour ajouter 1d10 dégâts et un effet de frappe brutale. Une fois par tour.',
  'Rage tenace':
    'À 0 PV sous Rage sans mourir sur le coup, sauvegarde de Constitution pour rester à 1 PV ; le DD augmente après chaque réussite et revient à sa valeur initiale au repos.',
  'Frappe brutale améliorée':
    'Frappe brutale inflige 2d10 dégâts supplémentaires et débloque de nouveaux effets.',
  'Rage persistante':
    'Rage dure jusqu’à 10 minutes sans devoir attaquer ni subir de dégâts. À l’initiative, tu récupères toutes ses utilisations si elles sont épuisées, une fois par repos long.',
  'Frappe brutale supérieure':
    'Frappe brutale inflige 3d10 dégâts supplémentaires et permet de combiner deux effets.',
  'Puissance indomptable':
    'Pour un test de Force ou une sauvegarde de Force, un total inférieur à ton score de Force est remplacé par ce score.',
  'Champion primordial':
    'Force et Constitution augmentent chacune de 4, jusqu’à un maximum de 25.',
  'Expertise':
    'Choisis des compétences maîtrisées : ton bonus de maîtrise y est doublé. Les choix supplémentaires de niveau supérieur sont gérés dans Options de classe.',
  'Touche-à-tout':
    'Ajoute la moitié du bonus de maîtrise, arrondie à l’inférieur, aux tests de caractéristique qui ne l’emploient pas déjà.',
  'Source d\'inspiration':
    'Les dés d’Inspiration bardique reviennent aussi après un repos court ; un emplacement de sort peut être converti en une utilisation.',
  'Contre-charme':
    'Réaction quand toi ou un allié proche rate une sauvegarde contre Charmé ou Effrayé : la sauvegarde est relancée avec avantage.',
  'Secrets magiques':
    'Quand tu prépares tes sorts de Barde, les listes de Clerc, Druide et Magicien comptent également comme liste de Barde pour toi.',
  'Inspiration supérieure':
    'À l’initiative, si tu as moins de deux utilisations d’Inspiration bardique, tu en récupères jusqu’à en avoir deux.',
  'Mots de création':
    'Mot de pouvoir guérisseur et Mot de pouvoir mortel sont toujours préparés ; chacun peut viser une seconde créature à 3 m de la première.',
  'Conduit divin':
    'Pouvoir divin alimentant Étincelle divine et Renvoi des morts-vivants ; ses utilisations sont suivies dans les ressources.',
  'Flétrissure des morts-vivants':
    'Les morts-vivants qui échouent contre Renvoi des morts-vivants subissent aussi des dégâts radiants croissant avec ta Sagesse.',
  'Frappes bénies':
    'Choisis Frappe divine ou Incantation puissante dans Options de classe ; l’application conserve ce choix.',
  'Intervention divine':
    'Action Magie : choisis un sort de Clerc de niveau 5 ou moins qui ne demande pas de réaction et lance-le sans emplacement ni composante matérielle, une fois par repos long.',
  'Frappes bénies améliorées':
    'L’option de Frappes bénies choisie au niveau 7 gagne son amélioration de niveau 14.',
  'Intervention divine majeure':
    'Intervention divine peut lancer Souhait ; après ce choix, elle ne revient qu’au terme de 2d4 repos longs.',
  'Forme sauvage':
    'Action bonus : adopte une forme de bête connue, conserve tes PV et gagne des PV temporaires égaux à ton niveau de Druide. Les utilisations sont suivies séparément.',
  'Compagnon sauvage':
    'Action de Magie : dépense au choix une utilisation de Forme sauvage ou un emplacement de sort, puis lance Trouver un familier sans composante matérielle. Le familier est une Fée et disparaît quand tu termines un repos long.',
  'Résurgence sauvage':
    'Sans Forme sauvage restante, une fois pendant chacun de tes tours tu peux dépenser un emplacement de sort pour récupérer une utilisation. Une fois par repos long, tu peux aussi dépenser une Forme sauvage pour créer un emplacement de niveau 1.',
  'Furie élémentaire':
    'Choisis Frappe primordiale ou Incantation puissante dans Options de classe.',
  'Furie élémentaire améliorée':
    'Frappe primordiale passe de 1d8 à 2d8. Incantation puissante allonge de 90 m la portée de tes sorts mineurs de Druide dont la portée atteint déjà 3 m.',
  'Sorts en forme de bête':
    'Tu peux lancer des sorts sous Forme sauvage. En revanche, tu ne peux pas y lancer un sort dont la composante matérielle indique un coût ou est consommée : la composante n’est pas ignorée, le sort est impossible.',
  'Don épique':
    'Choisis une faveur épique recommandée ou tout autre don auquel tu es éligible.',
  'Archidruide':
    'Forme sauvage pérenne : à l’initiative sans utilisation restante, récupère 1 Forme sauvage. Magicien de la nature : une fois par repos long et sans action, convertis des utilisations non dépensées en un seul emplacement, à raison de deux niveaux de sort par utilisation. Longévité : ton corps vieillit d’un an tous les dix ans.',
  'Fougue guerrière':
    'Une fois à ton tour, gagne une action supplémentaire qui ne peut pas servir à lancer un sort par l’action Magie. Recharge au repos court ou long.',
  'Esprit tactique':
    'Après un test de caractéristique raté, dépense Second souffle pour ajouter 1d10 ; si le test échoue encore, l’utilisation n’est pas consommée.',
  'Repli tactique':
    'Quand Second souffle est utilisé, déplace-toi jusqu’à la moitié de ta vitesse sans provoquer d’attaques d’opportunité.',
  'Indomptable':
    'Relance une sauvegarde ratée avec un bonus égal au niveau de Guerrier. Les utilisations reviennent au repos long.',
  'Maître tactique':
    'Pour chaque attaque avec une arme dont tu maîtrises la propriété, tu peux employer Repoussement, Affaiblissement ou Ralentissement à la place de sa maîtrise normale.',
  'Deux attaques supplémentaires':
    'Tu effectues trois attaques lorsque tu entreprends l’action Attaquer.',
  'Attaques étudiées':
    'Après une attaque ratée contre une créature, avantage à ta prochaine attaque contre elle avant la fin de ton prochain tour.',
  'Fougue guerrière : deux usages':
    'Fougue guerrière possède désormais deux utilisations entre deux repos.',
  'Trois attaques supplémentaires':
    'Tu effectues quatre attaques lorsque tu entreprends l’action Attaquer.',
  'Concentration du moine':
    'Tes points de Concentration alimentent Déluge de coups, Défense patiente et Pas du vent ; ils reviennent au repos court ou long.',
  'Métabolisme surnaturel':
    'À l’initiative, une fois par repos long, restaure toute ta Concentration et récupère niveau de Moine + un dé d’Arts martiaux PV.',
  'Déplacement sans armure':
    'Sans armure ni bouclier, ta vitesse augmente selon ton niveau de Moine.',
  'Parade':
    'Réaction après avoir subi des dégâts contondants, perforants ou tranchants : réduction égale à Dextérité + niveau de Moine + dé d’Arts martiaux ; une réduction totale peut renvoyer un projectile.',
  'Chute ralentie':
    'Réaction pendant une chute : réduis les dégâts de cinq fois ton niveau de Moine.',
  'Frappe étourdissante':
    'Après une frappe à mains nues touchée, dépense 1 Concentration : sauvegarde de Constitution ou Étourdi jusqu’au début de ton prochain tour ; réussite = vitesse divisée par deux et prochaine attaque contre la cible avant ton tour avec avantage.',
  'Frappes renforcées':
    'Choisis force ou type normal pour les dégâts de tes frappes à mains nues.',
  'Évasion':
    'Sauvegarde de Dextérité : aucun dégât en cas de réussite et moitié en cas d’échec ; inutilisable si Incapable d’agir.',
  'Déplacement acrobatique':
    'Pendant ton tour, cours sur les surfaces verticales et les liquides sans tomber pendant le déplacement.',
  'Concentration accrue':
    'Déluge de coups, Défense patiente et Pas du vent gagnent leurs améliorations de niveau 10.',
  'Restauration personnelle':
    'Action bonus : termine Charmé, Effrayé ou Empoisonné sur toi-même ; à la fin du tour, un degré d’Épuisement peut aussi être retiré au prix de Concentration.',
  'Déviation d\'énergie':
    'Parade peut réduire n’importe quel type de dégâts et renvoyer l’énergie réduite à une cible proche en dépensant de la Concentration.',
  'Survivant discipliné':
    'Maîtrise de toutes les sauvegardes ; une sauvegarde ratée peut être relancée en dépensant 1 Concentration.',
  'Concentration parfaite':
    'À l’initiative avec 3 points de Concentration ou moins, remonte à 4 si tu n’utilises pas Métabolisme surnaturel.',
  'Défense supérieure':
    'Action bonus et 3 Concentration : résistance à tous les dégâts sauf force pendant 1 minute, ou jusqu’à Incapable d’agir.',
  'Corps et esprit':
    'Dextérité et Sagesse augmentent chacune de 4, jusqu’à un maximum de 25.',
  'Style de combat':
    'Choisis un don de style de combat dans Options de classe.',
  'Châtiment du paladin':
    'Châtiment divin est toujours préparé et peut être lancé gratuitement une fois par repos long.',
  'Destrier fidèle':
    'Appel de destrier est toujours préparé et peut être lancé gratuitement une fois par repos long.',
  'Aura de protection':
    'Toi et les alliés à 3 m ajoutez ton Charisme aux sauvegardes tant que tu es conscient.',
  'Abjuration des ennemis':
    'Action Magie et Conduit divin : plusieurs ennemis proches font une sauvegarde de Sagesse ou sont Effrayés et ralentis pendant 1 minute.',
  'Aura de courage':
    'Toi et les alliés dans ton Aura de protection êtes immunisés à Effrayé.',
  'Frappes radiantes':
    'Chaque attaque de mêlée touchée inflige 1d8 dégâts radiants supplémentaires.',
  'Toucher restaurateur':
    'Dépense 5 points d’Imposition des mains pour terminer un état parmi ceux permis par cette capacité.',
  'Auras étendues':
    'Les auras de Paladin passent de 3 m à 9 m.',
  'Explorateur agile':
    'Gagne une Expertise et deux langues supplémentaires.',
  'Vagabond':
    'Vitesse +3 m ; gagne une vitesse d’escalade et une vitesse de nage égales à ta vitesse.',
  'Infatigable':
    'Action de Magie : gagne 1d8 + Sagesse PV temporaires (minimum 1), un nombre de fois égal à ton modificateur de Sagesse (minimum 1) ; un repos court retire aussi un degré d’Épuisement.',
  'Chasseur implacable':
    'Les dégâts ne peuvent plus interrompre ta concentration sur Marque du chasseur.',
  'Voile de la nature':
    'Action bonus : Invisible jusqu’à la fin de ton prochain tour, avec un nombre d’utilisations égal à ton modificateur de Sagesse.',
  'Chasseur précis':
    'Avantage aux attaques contre la créature marquée par Marque du chasseur.',
  'Sens farouches':
    'Perception aveugle à 9 m.',
  'Tueur d\'ennemis':
    'Le dé de dégâts de Marque du chasseur devient un d10.',
  'Ruse':
    'Action bonus : Foncer, Se désengager ou Se cacher.',
  'Visée assurée':
    'Action bonus sans déplacement : vitesse 0 pour le tour et avantage à la prochaine attaque du même tour.',
  'Frappe rusée':
    'Quand Attaque sournoise inflige ses dégâts, sacrifie des dés pour appliquer un effet de Frappe rusée.',
  'Esquive instinctive':
    'Réaction quand une attaque visible te touche : dégâts de cette attaque divisés par deux.',
  'Talent fiable':
    'Pour un test de caractéristique auquel s’ajoute ta maîtrise, un résultat de d20 inférieur à 10 devient 10.',
  'Frappe rusée améliorée':
    'Une même Attaque sournoise peut recevoir deux effets de Frappe rusée en payant le coût de chacun.',
  'Frappes sournoises':
    'Débloque les effets avancés de Frappe rusée.',
  'Esprit insaisissable':
    'Maîtrise des sauvegardes de Sagesse et de Charisme.',
  'Insaisissable':
    'Aucune attaque ne peut avoir l’avantage contre toi tant que tu n’es pas Incapable d’agir.',
  'Coup de chance':
    'Après un test de d20 raté, transforme le résultat du d20 en 20, une fois par repos court ou long.',
  'Source de magie':
    'Gagne les points de sorcellerie et la conversion entre points et emplacements de sort.',
  'Métamagie':
    'Choisis des options qui modifient les sorts en dépensant des points de sorcellerie.',
  'Restauration sorcelière':
    'À la fin d’un repos court, récupère des points de sorcellerie jusqu’à la moitié de ton niveau, une fois par repos long.',
  'Sorcellerie incarnée':
    'Tant que Sorcellerie innée est active, deux options de Métamagie peuvent s’appliquer au même sort.',
  'Apothéose arcanique':
    'Sous Sorcellerie innée, une option de Métamagie par tour ne coûte aucun point de sorcellerie.',
  'Ruse magique':
    'Rituel d’une minute : récupère la moitié de tes emplacements de pacte, arrondie au supérieur, une fois par repos long.',
  'Contact du Patron':
    'Contact extraplanaire est toujours préparé. Une fois par repos long, lance-le sans emplacement pour contacter ton patron et réussis automatiquement sa sauvegarde.',
  'Arcane mystique (niveau 6)':
    'Choisis un sort d’Occultiste de niveau 6 et lance-le sans emplacement une fois par repos long.',
  'Arcane mystique (niveau 7)':
    'Choisis un sort d’Occultiste de niveau 7 et lance-le sans emplacement une fois par repos long.',
  'Arcane mystique (niveau 8)':
    'Choisis un sort d’Occultiste de niveau 8 et lance-le sans emplacement une fois par repos long.',
  'Arcane mystique (niveau 9)':
    'Choisis un sort d’Occultiste de niveau 9 et lance-le sans emplacement une fois par repos long.',
  'Maître occulte':
    'Quand tu termines Ruse magique, tu récupères tous tes emplacements de Magie de pacte au lieu de la moitié. Le rite conserve sa durée normale.',
  'Érudit':
    'Choisis Arcanes, Histoire, Investigation, Médecine, Nature ou Religion parmi tes maîtrises et gagne l’Expertise correspondante.',
  'Mémoriser un sort':
    'Après un repos court, remplace un sort de Magicien préparé par un autre sort de ton grimoire.',
  'Maîtrise des sorts':
    'Choisis un sort de niveau 1 et un de niveau 2 avec une action d’incantation : toujours préparés et lançables à leur niveau sans emplacement.',
  'Sorts de prédilection':
    'Choisis deux sorts de niveau 3 de ton grimoire : toujours préparés et chacun lançable une fois sans emplacement par repos court ou long.',
};

/** Capacités du tronc commun acquises jusqu'à ce niveau de classe inclus. */
export const classFeaturesUpTo = (classId: string, level: number): string[] =>
  Object.entries(CLASS_FEATURES[classId] ?? {})
    .filter(([featureLevel]) => level >= Number(featureLevel))
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .flatMap(([, names]) => names);

/** Capacités gagnées exactement à ce niveau (pour un écran de montée de niveau). */
export const classFeaturesAt = (classId: string, level: number): string[] =>
  CLASS_FEATURES[classId]?.[level] ?? [];
