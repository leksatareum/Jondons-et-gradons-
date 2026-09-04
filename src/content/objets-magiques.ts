/**
 * Les objets magiques — Guide du Maître 2024, chapitre 7.
 *
 * ═══ Ce lot : les objets COMMUNS, et eux seuls ═══
 *
 * Le chapitre fait une centaine de pages et cinq raretés. Ce fichier n'en
 * contient qu'une : les 51 objets communs. C'est délibéré, et c'est ce qui
 * concerne un groupe de niveau 2 ou 3 — le Guide place les objets rares et
 * au-delà bien plus haut dans la campagne. Le reste viendra par lots.
 *
 * ═══ Comment le scan a été lu ═══
 *
 * Chaque entrée du livre porte, sous son nom, une ligne de type et de rareté
 * (« Wondrous Item, Common »). Cette ligne est repérable à la machine : c'est
 * elle qui a servi d'ancre, page par page, plutôt qu'une lecture au jugé.
 *
 * Le piège reste le même que partout ailleurs : les deux colonnes du livre
 * s'entrelacent ligne à ligne à l'océrisation, si bien que le corps d'un objet
 * se mélange à celui de son voisin. Chaque entrée a donc été relue à sa page,
 * et les titres abîmés — « Cancer oF Fuvine » pour Carpet of Flying — retrouvés
 * par leur voisinage alphabétique. Les 51 noms retenus ont ensuite été
 * revérifiés un à un contre le scan.
 *
 * ═══ Les distances ═══
 *
 * Converties en mètres comme partout dans l'appli : 1,50 m pour 5 pieds, 3 m
 * pour 10, 9 m pour 30, 18 m pour 60, 36 m pour 120, 90 m pour 300, 180 m
 * pour 600.
 */

export type Rarete = 'commun' | 'peu-commun' | 'rare' | 'tres-rare' | 'legendaire';

export type CategorieObjet =
  | 'arme' | 'munition' | 'armure' | 'bouclier'
  | 'potion' | 'baguette' | 'baton' | 'merveilleux';

export type ObjetMagique = {
  id: string;
  nom: string;
  categorie: CategorieObjet;
  rarete: Rarete;
  /**
   * Ce que l'objet PEUT être, quand le livre le restreint : « toute armure
   * légère, intermédiaire ou lourde », « dague, rapière… ». Absent pour un
   * objet merveilleux, qui n'a pas de support.
   */
  support?: string;
  /**
   * L'harmonisation, quand elle est demandée. La chaîne dit la restriction
   * (« un occultiste ») ; une chaîne vide veut dire « harmonisation, sans
   * condition ». C'est le seul champ dont l'oubli coûte quelque chose à la
   * table : on ne porte que trois objets harmonisés.
   */
  harmonisation?: string;
  effet: string;
  /** Page imprimée du Guide. */
  page: number;
};

export const LIBELLE_RARETE: Record<Rarete, string> = {
  commun: 'commun',
  'peu-commun': 'peu commun',
  rare: 'rare',
  'tres-rare': 'très rare',
  legendaire: 'légendaire',
};

export const LIBELLE_CATEGORIE: Record<CategorieObjet, string> = {
  arme: 'Arme',
  munition: 'Munition',
  armure: 'Armure',
  bouclier: 'Bouclier',
  potion: 'Potion',
  baguette: 'Baguette',
  baton: 'Bâton',
  merveilleux: 'Objet merveilleux',
};

const c = 'commun' as const;

export const OBJETS_MAGIQUES: ObjetMagique[] = [
  {
    id: 'armure-rutilante', nom: 'Armure rutilante', categorie: 'armure', rarete: c, page: 230,
    support: 'toute armure légère, intermédiaire ou lourde',
    effet: 'Cette armure ne se salit jamais.',
  },
  {
    id: 'perle-de-nourriture', nom: 'Perle de nourriture', categorie: 'merveilleux', rarete: c, page: 235,
    effet: 'Cette perle gélatineuse et sans goût se dissout sur la langue et nourrit autant qu’une journée de rations.',
  },
  {
    id: 'perle-de-rafraichissement', nom: 'Perle de rafraîchissement', categorie: 'merveilleux', rarete: c, page: 235,
    effet: 'Cette perle gélatineuse et sans goût se dissout dans un liquide et transforme jusqu’à une pinte de ce liquide '
      + 'en eau fraîche et potable. Sans effet sur les liquides magiques et sur les substances nocives comme le poison.',
  },
  {
    id: 'bottes-de-fausses-traces', nom: 'Bottes de fausses traces', categorie: 'merveilleux', rarete: c, page: 239,
    harmonisation: '',
    effet: 'Tu peux leur faire laisser les traces de n’importe quel humanoïde de ta taille.',
  },
  {
    id: 'bougie-des-profondeurs', nom: 'Bougie des profondeurs', categorie: 'merveilleux', rarete: c, page: 242,
    effet: 'La flamme de cette bougie ne s’éteint pas sous l’eau. Elle éclaire et chauffe comme une bougie ordinaire.',
  },
  {
    id: 'armure-a-defaire', nom: 'Armure à défaire', categorie: 'armure', rarete: c, page: 243,
    support: 'toute armure légère, intermédiaire ou lourde',
    effet: 'Tu peux retirer cette armure par une action Magie.',
  },
  {
    id: 'de-du-charlatan', nom: 'Dé du charlatan', categorie: 'merveilleux', rarete: c, page: 243,
    harmonisation: '',
    effet: 'Chaque fois que tu lances ce dé à six faces, tu choisis le résultat.',
  },
  {
    id: 'cape-bouffante', nom: 'Cape bouffante', categorie: 'merveilleux', rarete: c, page: 244,
    effet: 'Action bonus : la faire bouffer dramatiquement pendant 1 minute.',
  },
  {
    id: 'cape-aux-mille-styles', nom: 'Cape aux mille styles', categorie: 'merveilleux', rarete: c, page: 245,
    effet: 'Action bonus : changer son style, sa couleur et son apparente qualité. Son poids ne change pas. '
      + 'Elle ne peut jamais être autre chose qu’une cape — et si elle imite une cape magique, elle n’en gagne pas les pouvoirs.',
  },
  {
    id: 'amulette-horlogerie', nom: 'Amulette d’horlogerie', categorie: 'merveilleux', rarete: c, page: 245,
    effet: 'Amulette de cuivre pleine d’engrenages, animée par la magie de Mécanus : elle tictaque et bourdonne doucement. '
      + 'Quand tu fais un jet d’attaque en la portant, tu peux renoncer à lancer le d20 et considérer que tu as fait 10. '
      + 'Utilisable une seule fois, puis plus jusqu’à l’aube suivante.',
  },
  {
    id: 'habits-qui-se-reprisent', nom: 'Habits qui se reprisent', categorie: 'merveilleux', rarete: c, page: 245,
    effet: 'Cette tenue élégante se répare toute seule de l’usure quotidienne. Une pièce détruite, elle, est perdue.',
  },
  {
    id: 'amulette-eclat-sombre', nom: 'Amulette d’éclat sombre', categorie: 'merveilleux', rarete: c, page: 248,
    harmonisation: 'un occultiste',
    effet: 'Amulette taillée dans un éclat de matière venu d’un autre monde. Tu peux t’en servir de FOCALISEUR pour tes sorts d’occultiste. '
      + 'Sort inconnu : par une action Magie, tu peux tenter un sort mineur que tu ne connais pas — il doit figurer sur la liste de l’occultiste '
      + 'et se lancer en une action. Test d’Intelligence (Arcanes) DD 10 : réussi, le sort part ; raté, il échoue et l’action est perdue. '
      + 'Dans les deux cas, plus rien avant un repos long.',
  },
  {
    id: 'heaume-d-effroi', nom: 'Heaume d’effroi', categorie: 'merveilleux', rarete: c, page: 254,
    effet: 'Sous ce heaume d’acier, tes yeux luisent de rouge et le reste de ton visage disparaît dans l’ombre.',
  },
  {
    id: 'cornet-acoustique', nom: 'Cornet acoustique', categorie: 'merveilleux', rarete: c, page: 256,
    effet: 'Porté à l’oreille, ce cornet supprime sur toi les effets de l’état Assourdi.',
  },
  {
    id: 'grimoire-inalterable', nom: 'Grimoire inaltérable', categorie: 'merveilleux', rarete: c, page: 257,
    effet: 'Ce grimoire, et tout ce qui est écrit dedans, ne craint ni le feu ni l’eau. Il ne se dégrade pas non plus avec le temps.',
  },
  {
    id: 'oeil-de-substitution', nom: 'Œil de substitution', categorie: 'merveilleux', rarete: c, page: 259,
    effet: 'Cet œil magique en remplace un vrai, perdu ou retiré. Logé dans l’orbite, tu vois à travers lui comme à travers ton œil naturel. '
      + 'Tu peux le poser ou l’ôter par une action Magie, et personne ne peut te l’arracher de ton vivant.',
  },
  {
    id: 'chapeau-a-vermine', nom: 'Chapeau à vermine', categorie: 'merveilleux', rarete: c, page: 267,
    effet: 'Ce chapeau a 3 charges. En le tenant, action Magie pour dépenser 1 charge et invoquer au choix une chauve-souris, une grenouille ou un rat. '
      + 'La bête apparaît dans le chapeau et cherche à fuir le plus vite possible. Elle est Indifférente envers toi comme envers tout le monde, '
      + 'n’est pas sous ton contrôle, se comporte comme une bête ordinaire, et disparaît au bout d’1 heure ou quand elle tombe à 0 PV. '
      + 'Le chapeau récupère toutes ses charges chaque jour à l’aube.',
  },
  {
    id: 'chapeau-de-magicien', nom: 'Chapeau de magicien', categorie: 'merveilleux', rarete: c, page: 267,
    harmonisation: 'un magicien',
    effet: 'Tu peux t’en servir de FOCALISEUR pour tes sorts de magicien. '
      + 'Sort inconnu : par une action Magie, tu peux tenter un sort mineur que tu ne connais pas — il doit figurer sur la liste du magicien '
      + 'et se lancer en une action. Test d’Intelligence (Arcanes) DD 10 : réussi, le sort part ; raté, il échoue et l’action est perdue. '
      + 'Dans les deux cas, plus rien avant un repos long.',
  },
  {
    id: 'bourse-a-epices-heward', nom: 'Bourse à épices d’Heward', categorie: 'merveilleux', rarete: c, page: 269,
    effet: 'Cette bourse paraît vide et a 10 charges. En la tenant, action Magie pour dépenser 1 charge, nommer n’importe quel assaisonnement '
      + 'non magique — sel, poivre, safran, coriandre — et en sortir une pincée. Une pincée suffit à assaisonner un repas. '
      + 'Elle récupère 1d6 + 4 charges chaque jour à l’aube.',
  },
  {
    id: 'cor-d-alarme-silencieuse', nom: 'Cor d’alarme silencieuse', categorie: 'merveilleux', rarete: c, page: 270,
    effet: 'Ce cor a 4 charges et en récupère 1d4 chaque jour à l’aube. Action Magie pour souffler dedans en dépensant 1 charge : '
      + 'une créature de ton choix entend l’appel, à condition d’être à moins de 180 m du cor. Personne d’autre ne l’entend.',
  },
  {
    id: 'instrument-d-illusions', nom: 'Instrument d’illusions', categorie: 'merveilleux', rarete: c, page: 271,
    effet: 'Pendant que tu en joues, action Magie pour créer des effets visuels illusoires et inoffensifs dans une émanation de 1,50 m autour de l’instrument — '
      + '4,50 m si tu es barde. Des notes lumineuses, une danseuse spectrale, des papillons, de la neige qui tombe doucement. '
      + 'Ils n’ont ni substance ni son, et sont manifestement illusoires. Ils cessent quand tu arrêtes de jouer.',
  },
  {
    id: 'instrument-d-ecriture', nom: 'Instrument d’écriture', categorie: 'merveilleux', rarete: c, page: 271,
    effet: 'Cet instrument a 3 charges et les récupère toutes chaque jour à l’aube. Pendant que tu en joues, action Magie pour dépenser 1 charge '
      + 'et écrire un message magique sur un objet ou une surface non magique visible à moins de 9 m. Six mots au plus, dans une langue que tu connais. '
      + 'Si tu es barde, sept mots de plus, et le message luit faiblement — lisible dans les ténèbres non magiques. '
      + 'Un Dissipation de la magie l’efface ; sinon il s’estompe au bout de 24 heures.',
  },
  {
    id: 'serrure-de-duperie', nom: 'Serrure de duperie', categorie: 'merveilleux', rarete: c, page: 275,
    effet: 'Cette serrure ressemble à une serrure ordinaire et vient avec une clé unique. Ses gorges se réajustent magiquement pour déjouer les voleurs : '
      + 'les tests de Dextérité pour la crocheter sont désavantagés.',
  },
  {
    id: 'epee-touchee-par-la-lune', nom: 'Épée touchée par la lune', categorie: 'arme', rarete: c, page: 280,
    support: 'une épée — la liste du livre se termine par « cimeterre ou épée courte », le début en est illisible sur notre exemplaire',
    effet: 'Dans les ténèbres, la lame dégainée répand un clair de lune : lumière vive sur 4,50 m, et lumière faible sur 4,50 m de plus.',
  },
  {
    id: 'cle-mystere', nom: 'Clé mystère', categorie: 'merveilleux', rarete: c, page: 280,
    effet: 'Un point d’interrogation est travaillé dans son panneton. Elle a 5 % de chances d’ouvrir n’importe quelle serrure où on l’introduit. '
      + 'Dès qu’elle a ouvert quelque chose, elle disparaît.',
  },
  {
    id: 'orbe-d-orientation', nom: 'Orbe d’orientation', categorie: 'merveilleux', rarete: c, page: 283,
    effet: 'Cet orbe sert de focaliseur arcanique. En le tenant, action Magie pour savoir où est le nord magnétique. '
      + 'Rien ne se passe dans un lieu qui n’en a pas.',
  },
  {
    id: 'orbe-du-temps', nom: 'Orbe du temps', categorie: 'merveilleux', rarete: c, page: 284,
    effet: 'Cet orbe sert de focaliseur arcanique. En le tenant, action Magie pour savoir si l’on est au matin, à l’après-midi, au soir ou à la nuit. '
      + 'Ne fonctionne que sur le plan Matériel.',
  },
  {
    id: 'parfum-d-envoutement', nom: 'Parfum d’envoûtement', categorie: 'merveilleux', rarete: c, page: 284,
    effet: 'Cette fiole contient de quoi s’en parfumer une seule fois. Action Magie pour l’appliquer sur toi ; l’effet dure 1 heure. '
      + 'Pendant ce temps, tu as l’avantage à tous les tests de Charisme (Tromperie et Persuasion) pour influencer une créature à moins de 1,50 m de toi.',
  },
  {
    id: 'pipe-a-monstres-de-fumee', nom: 'Pipe à monstres de fumée', categorie: 'merveilleux', rarete: c, page: 285,
    effet: 'En la fumant, action Magie pour souffler une bouffée qui prend la forme d’une créature — un dragon, un flumph, un slaad. '
      + 'La forme doit tenir dans un cube de 30 cm et se défait au bout de quelques secondes, redevenant une bouffée ordinaire.',
  },
  {
    id: 'perche-a-peche', nom: 'Perche à pêche', categorie: 'merveilleux', rarete: c, page: 286,
    effet: 'Cet objet fonctionne comme une perche. En la tenant, action Magie pour la transformer en canne à pêche munie d’un hameçon, '
      + 'd’une ligne et d’un moulinet — ou pour la rendre à son état de perche.',
  },
  {
    id: 'perche-pliante', nom: 'Perche pliante', categorie: 'merveilleux', rarete: c, page: 286,
    effet: 'Cet objet fonctionne comme une perche. En la tenant, action Magie pour la replier en une tige de 30 cm, facile à ranger — '
      + 'son poids ne change pas — ou pour rendre la tige à son état de perche. Elle ne se déplie que si la place le permet.',
  },
  {
    id: 'potion-d-escalade', nom: 'Potion d’escalade', categorie: 'potion', rarete: c, page: 287,
    effet: 'Tu gagnes une vitesse d’escalade égale à ta vitesse pendant 1 heure, et l’avantage aux tests de Force (Athlétisme) pour grimper. '
      + 'Le liquide est séparé en couches brune, argentée et grise, comme des bandes de pierre — les secouer ne les mélange pas.',
  },
  {
    id: 'potion-de-comprehension', nom: 'Potion de compréhension', categorie: 'potion', rarete: c, page: 287,
    effet: 'Tu gagnes l’effet du sort Compréhension des langues pendant 1 heure. '
      + 'Le liquide est clair, avec des grains de sel et de suie en suspension.',
  },
  {
    id: 'pot-d-eveil', nom: 'Pot d’éveil', categorie: 'merveilleux', rarete: c, page: 289,
    effet: 'Plante un arbuste ordinaire dans ce pot d’argile de 5 kg et laisse-le pousser 30 jours : au terme, l’arbuste devient un Arbuste éveillé.',
  },
  {
    id: 'membre-prothetique', nom: 'Membre prothétique', categorie: 'merveilleux', rarete: c, page: 290,
    effet: 'Cet objet remplace un membre perdu — une main, un bras, un pied, une jambe, ou une partie du corps semblable. '
      + 'Attaché, il fonctionne exactement comme ce qu’il remplace. Tu peux le détacher ou le rattacher par une action Magie, '
      + 'et personne ne peut te l’enlever de ton vivant.',
  },
  {
    id: 'piece-des-rivaux', nom: 'Pièce des rivaux', categorie: 'merveilleux', rarete: c, page: 296,
    effet: 'Pièce d’or frappée d’une créature sur chaque face, deux rivaux ou ennemis célèbres l’un de l’autre. L’un est le côté pile, l’autre le côté face. '
      + 'Elle a 1 charge et la récupère chaque jour à l’aube. Action Magie pour la lancer en dépensant sa charge : lance n’importe quel dé, '
      + 'pair pour face, impair pour pile. FACE — une créature visible à moins de 18 m fait une sauvegarde de Sagesse DD 13 ; échec : 2d4 dégâts psychiques '
      + 'et désavantage à son prochain jet d’attaque avant la fin de son prochain tour ; réussite : la moitié des dégâts seulement. '
      + 'PILE — tu subis 1d4 dégâts psychiques.',
  },
  {
    id: 'corde-qui-se-recoud', nom: 'Corde qui se recoud', categorie: 'merveilleux', rarete: c, page: 302,
    effet: 'Ce rouleau de 15 m se répare tout seul, quel que soit le nombre de morceaux. Action Magie pour que tous les brins en contact, '
      + 'et pas autrement employés, se renouent. Une corde dont un tronçon a été perdu ou détruit reste raccourcie pour toujours.',
  },
  {
    id: 'rubis-du-mage-de-guerre', nom: 'Rubis du mage de guerre', categorie: 'merveilleux', rarete: c, page: 302,
    harmonisation: 'un lanceur de sorts',
    effet: 'Gravé de runes, ce rubis de 2,5 cm te permet d’employer une arme simple ou de guerre comme FOCALISEUR pour tes sorts. '
      + 'Il faut d’abord le presser contre l’arme pendant au moins 10 minutes. Ensuite il ne s’enlève plus, sauf par une action Magie de ta part, '
      + 'si l’arme est détruite, ou si ton harmonisation prend fin.',
  },
  {
    id: 'bouclier-expressif', nom: 'Bouclier expressif', categorie: 'bouclier', rarete: c, page: 303,
    effet: 'La face de ce bouclier est sculptée en visage. En le portant, action bonus pour changer l’expression de ce visage.',
  },
  {
    id: 'arme-argentee', nom: 'Arme argentée', categorie: 'arme', rarete: c, page: 304,
    support: 'toute arme simple ou de guerre',
    effet: 'Un procédé alchimique a lié de l’argent à cette arme magique. Sur un coup critique contre une créature métamorphosée, '
      + 'elle inflige un dé de dégâts supplémentaire.',
  },
  {
    id: 'armure-fumante', nom: 'Armure fumante', categorie: 'armure', rarete: c, page: 305,
    support: 'toute armure légère, intermédiaire ou lourde',
    effet: 'Des volutes de fumée inoffensive et inodore s’élèvent de cette armure tant qu’on la porte.',
  },
  {
    id: 'baton-d-ornement', nom: 'Bâton d’ornement', categorie: 'baton', rarete: c, page: 306,
    effet: 'Pose un objet minuscule de moins de 500 g — un éclat de cristal, un œuf, une pierre — au-dessus de la pointe de ce bâton en le tenant : '
      + 'l’objet flotte à deux ou trois centimètres de la pointe et y reste jusqu’à ce qu’on le retire, ou que le bâton quitte tes mains. '
      + 'Le bâton peut porter jusqu’à trois objets ainsi. En le tenant, tu peux en faire tourner un ou plusieurs lentement sur eux-mêmes.',
  },
  {
    id: 'baton-a-chants-d-oiseaux', nom: 'Bâton à chants d’oiseaux', categorie: 'baton', rarete: c, page: 307,
    effet: 'Bâton de bois orné d’oiseaux sculptés, 10 charges. En le tenant, action Magie pour dépenser 1 charge et produire un son audible jusqu’à 36 m : '
      + 'pinson, corbeau, canard, poule, oie, plongeon, dindon, mouette, hibou ou aigle. '
      + 'Il récupère 1d6 + 4 charges chaque jour à l’aube. Si tu dépenses la dernière, lance 1d20 : sur un 1, il explose en un nuage de plumes inoffensif et est perdu.',
  },
  {
    id: 'baton-a-fleurs', nom: 'Bâton à fleurs', categorie: 'baton', rarete: c, page: 308,
    effet: 'Bâton de bois, 10 charges. En le tenant, action Magie pour dépenser 1 charge et faire pousser une fleur d’une plaque de terre à moins de 1,50 m, '
      + 'ou du bâton lui-même. Sans précision de ta part, c’est une marguerite au parfum léger. Elle est inoffensive, non magique, et pousse ou fane normalement. '
      + 'Il récupère 1d6 + 4 charges chaque jour à l’aube. Si tu dépenses la dernière, lance 1d20 : sur un 1, il se change en fleurs.',
  },
  {
    id: 'serre-sylvestre', nom: 'Serre sylvestre', categorie: 'arme', rarete: c, page: 314,
    support: 'dague, rapière, cimeterre, épée courte, serpe ou lance',
    harmonisation: '',
    effet: 'Tant que cette arme est sur toi, tu comprends la communication non écrite de toutes les créatures féeriques, et elles comprennent la tienne. '
      + 'Message secret : par une action Magie, tu peux lancer Message avec l’arme. Une fois utilisé, plus rien avant l’aube suivante.',
  },
  {
    id: 'poupee-parlante', nom: 'Poupée parlante', categorie: 'merveilleux', rarete: c, page: 315,
    harmonisation: '',
    effet: 'Tant que la poupée est à moins de 1,50 m de toi, tu peux passer un repos court à lui apprendre jusqu’à six phrases de six mots au plus, '
      + 'et fixer pour chacune la condition qui la déclenche. Tu peux remplacer d’anciennes phrases par de nouvelles. '
      + 'La condition doit se produire à moins de 1,50 m de la poupée — par exemple, chaque fois que quelqu’un la ramasse.',
  },
  {
    id: 'chope-de-sobriete', nom: 'Chope de sobriété', categorie: 'merveilleux', rarete: c, page: 315,
    effet: 'Un visage sévère est sculpté sur son flanc. Tu peux y boire bière, vin ou tout autre alcool non magique sans jamais t’enivrer. '
      + 'Sans effet sur les liquides magiques et sur les substances nocives comme le poison.',
  },
  {
    id: 'canne-du-veteran', nom: 'Canne du vétéran', categorie: 'merveilleux', rarete: c, page: 318,
    effet: 'Action bonus : transformer cette canne de marche en épée longue ordinaire, ou l’épée en canne. Dans les deux cas, tu dois la tenir.',
  },
  {
    id: 'munition-assommante', nom: 'Munition assommante', categorie: 'munition', rarete: c, page: 318,
    support: 'toute munition',
    effet: 'La créature touchée doit réussir une sauvegarde de Force DD 10, sinon elle est À terre.',
  },
  {
    id: 'baguette-de-chef-d-orchestre', nom: 'Baguette de chef d’orchestre', categorie: 'baguette', rarete: c, page: 319,
    effet: 'Cette baguette a 3 charges. En la tenant, action Magie pour dépenser 1 charge et créer une musique d’orchestre en la balançant. '
      + 'On l’entend jusqu’à 36 m, et elle s’arrête quand tu cesses. '
      + 'Elle récupère toutes ses charges dépensées chaque jour à l’aube. Si tu dépenses la dernière, lance 1d20 : sur un 1, un son de tuba triste retentit.',
  },
  {
    id: 'baguette-de-pyrotechnie', nom: 'Baguette de pyrotechnie', categorie: 'baguette', rarete: c, page: 321,
    effet: 'Cette baguette a 7 charges. En la tenant, action Magie pour dépenser 1 charge et faire éclater une gerbe de lumière multicolore inoffensive '
      + 'en un point visible jusqu’à 36 m, accompagnée d’un crépitement audible jusqu’à 90 m. La lumière est aussi vive qu’une torche, mais ne dure qu’une seconde. '
      + 'Elle récupère 1d6 + 1 charges chaque jour à l’aube. Si tu dépenses la dernière, lance 1d20 : sur un 1, elle part en feu d’artifice inoffensif et est détruite.',
  },
];

/** Les objets d'une rareté, rangés par nom. */
export const objetsParRarete = (rarete: Rarete): ObjetMagique[] =>
  OBJETS_MAGIQUES.filter((objet) => objet.rarete === rarete)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

/** Une recherche simple sur le nom, sans accent ni casse. */
export function chercherObjet(question: string): ObjetMagique[] {
  const sansAccent = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const cible = sansAccent(question.trim());
  if (!cible) return [...OBJETS_MAGIQUES].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  return OBJETS_MAGIQUES
    .filter((objet) => sansAccent(objet.nom).includes(cible))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/**
 * Ce que le Guide dit du rythme, et qui vaut d'être rappelé sous la liste :
 * les objets communs ne déséquilibrent rien, et le livre les distribue tôt.
 */
export const NOTE_COMMUNS =
  'Les objets communs sont ceux qu’un groupe croise dès les premiers niveaux : '
  + 'ils amusent, ils ne déséquilibrent rien. Les raretés supérieures viendront par lots.';

export const RAPPEL_HARMONISATION =
  'On ne porte que trois objets harmonisés à la fois. C’est le seul chiffre qui limite vraiment un personnage, '
  + 'et c’est celui qu’on oublie en distribuant.';
