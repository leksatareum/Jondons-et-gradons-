/**
 * Les objets magiques — Guide du Maître 2024, chapitre 7.
 *
 * ═══ Ce qu'il y a ici : le COMMUN et le PEU COMMUN ═══
 *
 * Le chapitre fait une centaine de pages et cinq raretés. Ce fichier en
 * contient deux : les 51 objets communs et les 90 peu communs. C'est ce
 * qu'un groupe voit avant le niveau 5 — le Guide place le rare et au-delà
 * bien plus haut dans la campagne.
 *
 * Une vérification qui valait le détour : l'armure +1 est RARE dans
 * l'édition 2024, alors que l'arme +1, le bouclier +1 et les munitions +1
 * sont peu communs. Elle n'est donc pas ici, malgré ce que l'habitude
 * suggère.
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
  | 'potion' | 'parchemin' | 'baguette' | 'baton' | 'anneau' | 'sceptre' | 'merveilleux';

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
  parchemin: 'Parchemin',
  baguette: 'Baguette',
  baton: 'Bâton',
  anneau: 'Anneau',
  sceptre: 'Sceptre',
  merveilleux: 'Objet merveilleux',
};

const c = 'commun' as const;
const pc = 'peu-commun' as const;

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
  // ═════════ Les objets PEU COMMUNS ═════════
  {
    id: 'cruche-d-alchimie', nom: 'Cruche d’alchimie', categorie: 'merveilleux', rarete: pc, page: 227,
    effet: 'Cette cruche de céramique semble contenir un gallon de liquide et pèse 6 kg, pleine ou vide. Elle clapote quand on la secoue, même vide. '
      + 'Action Magie pour nommer un liquide de la table du Guide et la lui faire produire : eau douce (30 l par jour), eau salée (45 l), '
      + 'bière, vinaigre, vin, huile, miel, mayonnaise — chacun avec son maximum quotidien.',
  },
  {
    id: 'munitions-plus', nom: 'Munitions +1, +2 ou +3', categorie: 'munition', rarete: pc, page: 228,
    support: 'toute munition',
    effet: 'Bonus aux jets d’attaque et de dégâts, qui suit la rareté : peu commun pour +1, rare pour +2, très rare pour +3. '
      + 'Une fois qu’elle a touché sa cible, la munition n’est plus magique. '
      + 'On en trouve d’ordinaire par dix ou par vingt ; dix pièces valent une potion de même rareté.',
  },
  {
    id: 'amulette-contre-la-detection', nom: 'Amulette contre la détection et la localisation', categorie: 'merveilleux', rarete: pc, page: 228,
    harmonisation: '',
    effet: 'Tant que tu la portes, tu ne peux pas être ciblé par les sorts de Divination ni perçu par un capteur magique de scrutation, à moins que tu ne l’autorises.',
  },
  {
    id: 'balai-dansant-de-baba-yaga', nom: 'Balai dansant de Baba Yaga', categorie: 'merveilleux', rarete: pc, page: 232,
    harmonisation: '',
    effet: 'L’archifée Baba Yaga en a fabriqué beaucoup, tous différents. En le tenant, action Magie pour le transformer en Balai animé sous ton contrôle. '
      + 'Il se place au plus près de toi, joue juste après toi dans l’initiative, et reste animé jusqu’à ce qu’une action bonus et un mot de commande le rendent inerte. '
      + 'À ton tour, tu le commandes mentalement s’il est à moins de 9 m et que tu n’es pas Incapable d’agir (aucune action requise). '
      + 'Réduit à 0 PV, il vole en éclats et est détruit ; s’il redevient inerte avant, il récupère tous ses PV.',
  },
  {
    id: 'sac-sans-fond', nom: 'Sac sans fond', categorie: 'merveilleux', rarete: pc, page: 234,
    effet: 'L’intérieur est bien plus vaste que l’extérieur : environ 60 cm sur 60 et 1,20 m de profondeur. Le sac pèse 2,5 kg quoi qu’il contienne. '
      + 'En sortir un objet demande une action Utiliser. S’il est percé ou déchiré, il est détruit et son contenu dispersé dans le plan Astral.',
  },
  {
    id: 'sac-a-malices', nom: 'Sac à malices', categorie: 'merveilleux', rarete: pc, page: 234,
    effet: 'Ce sac de tissu gris, rouille ou fauve paraît vide, mais la main y trouve un petit objet duveteux. '
      + 'Action Magie pour l’en sortir et le lancer jusqu’à 6 m : en atterrissant, il devient une créature déterminée par la table correspondant à la couleur du sac. '
      + 'Elle disparaît à l’aube suivante ou à 0 PV. Elle est Amicale envers toi et tes alliés, et joue juste après toi dans l’initiative. '
      + 'Action bonus pour lui commander son déplacement et son action.',
  },
  {
    id: 'bottes-elfiques', nom: 'Bottes elfiques', categorie: 'merveilleux', rarete: pc, page: 239,
    effet: 'Tes pas ne font aucun bruit, quelle que soit la surface. Tu as aussi l’avantage aux tests de Dextérité (Discrétion).',
  },
  {
    id: 'bottes-de-foulee-et-de-bond', nom: 'Bottes de foulée et de bond', categorie: 'merveilleux', rarete: pc, page: 240,
    harmonisation: '',
    effet: 'Ta vitesse passe à 9 m si elle est inférieure, et n’est plus réduite ni par une charge dépassant ta capacité de transport, ni par une armure lourde. '
      + 'Une fois par tour, tu peux sauter jusqu’à 9 m en ne dépensant que 3 m de mouvement.',
  },
  {
    id: 'bottes-des-terres-hivernales', nom: 'Bottes des terres hivernales', categorie: 'merveilleux', rarete: pc, page: 240,
    harmonisation: '',
    effet: 'Ces bottes fourrées sont chaudes et bien ajustées. Résistance au froid : tu résistes aux dégâts de froid et supportes −18 °C ou moins sans protection supplémentaire. '
      + 'Marcheur d’hiver : tu ignores le terrain difficile créé par la glace ou la neige.',
  },
  {
    id: 'brassards-d-archerie', nom: 'Brassards d’archerie', categorie: 'merveilleux', rarete: pc, page: 240,
    harmonisation: '',
    effet: 'Tu es formé à l’arc long et à l’arc court, et tu gagnes +2 aux jets de dégâts faits avec ces armes.',
  },
  {
    id: 'broche-de-protection', nom: 'Broche de protection', categorie: 'merveilleux', rarete: pc, page: 241,
    harmonisation: '',
    effet: 'Tu résistes aux dégâts de force, et tu es immunisé aux dégâts du sort Projectile magique.',
  },
  {
    id: 'balai-volant', nom: 'Balai volant', categorie: 'merveilleux', rarete: pc, page: 241,
    harmonisation: '',
    effet: 'Action Magie pour le faire léviter et t’en servir de monture volante : vitesse de vol 15 m, jusqu’à 180 kg de charge — 9 m au-delà de 90 kg. '
      + 'Il cesse de léviter quand tu te poses ou que tu le quittes. '
      + 'Action Magie pour l’envoyer seul vers un lieu que tu nommes à moins de 1,5 km et que tu connais ; il revient sur un mot de commande s’il est encore dans ce rayon.',
  },
  {
    id: 'bonnet-de-respiration-aquatique', nom: 'Bonnet de respiration aquatique', categorie: 'merveilleux', rarete: pc, page: 242,
    effet: 'Sous l’eau, action Magie pour créer une bulle d’air autour de ta tête qui te permet de respirer normalement. '
      + 'Elle reste jusqu’à ce que tu retires le bonnet ou que tu sortes de l’eau.',
  },
  {
    id: 'diademe-de-deflagration', nom: 'Diadème de déflagration', categorie: 'merveilleux', rarete: pc, page: 244,
    effet: 'En le portant, tu peux lancer Rayon ardent avec (+5 au toucher). Plus rien avant l’aube suivante.',
  },
  {
    id: 'cape-elfique', nom: 'Cape elfique', categorie: 'merveilleux', rarete: pc, page: 244,
    harmonisation: '',
    effet: 'Les tests de Sagesse (Perception) pour te repérer sont désavantagés, et tu as l’avantage aux tests de Dextérité (Discrétion).',
  },
  {
    id: 'cape-de-protection', nom: 'Cape de protection', categorie: 'merveilleux', rarete: pc, page: 245,
    harmonisation: '',
    effet: 'Tu gagnes +1 à la classe d’armure et aux jets de sauvegarde.',
  },
  {
    id: 'cape-de-la-raie-manta', nom: 'Cape de la raie manta', categorie: 'merveilleux', rarete: pc, page: 245,
    harmonisation: '',
    effet: 'Tu respires sous l’eau et tu as une vitesse de nage de 18 m.',
  },
  {
    id: 'carafe-d-eau-infinie', nom: 'Carafe d’eau infinie', categorie: 'merveilleux', rarete: pc, page: 249,
    effet: 'Cette gourde bouchée clapote comme si elle contenait de l’eau ; elle pèse 1 kg. Action Magie, mot de commande : de l’eau douce ou salée (au choix) en sort, '
      + 'et cesse au début de ton tour suivant. FONTAINE : 20 litres. GEYSER : 115 litres jaillissant en ligne de 9 m de long sur 30 cm de large — '
      + 'tu peux viser (aucune action requise) ; une créature au choix dans la ligne doit réussir une sauvegarde, sinon elle est À terre, '
      + 'ou tu peux souffler un objet non porté.',
  },
  {
    id: 'jeu-d-illusions', nom: 'Jeu d’illusions', categorie: 'merveilleux', rarete: pc, page: 249,
    effet: 'Cette boîte contient un jeu de cartes : 34 en tout, dont 32 représentant une créature précise et deux à surface miroitante. '
      + 'Un jeu trouvé en trésor est généralement incomplet. Action Magie pour en tirer une au hasard et la jeter à terre à moins de 9 m : '
      + 'l’illusion de la créature indiquée apparaît. Elle a l’air réelle, de taille réelle, mais ne fait aucun bruit et ne peut rien faire. '
      + 'Elle dure jusqu’à ce qu’on la dissipe ou qu’elle sorte de 9 m de la carte.',
  },
  {
    id: 'globe-flottant', nom: 'Globe flottant', categorie: 'merveilleux', rarete: pc, page: 254,
    effet: 'Cette petite sphère de verre épais pèse 500 g. À moins de 18 m d’elle, tu peux lui commander d’émettre une lumière équivalente au sort Lumière ou Lumière du jour (au choix) ; '
      + 'l’effet Lumière du jour ne peut plus resservir avant l’aube suivante. Un autre ordre, par une action Magie, la fait s’élever et flotter à 1,50 m du sol au plus.',
  },
  {
    id: 'poussiere-de-disparition', nom: 'Poussière de disparition', categorie: 'merveilleux', rarete: pc, page: 255,
    effet: 'Cette poudre ressemble à du sable fin ; il y en a pour un seul usage. Action Utiliser pour la jeter en l’air : toi et chaque créature et objet dans une émanation de 3 m '
      + 'autour de toi devenez Invisibles pour 2d4 minutes. La durée est la même pour tous, et la poussière est consommée. '
      + 'Dès qu’une créature affectée fait un jet d’attaque, inflige des dégâts ou lance un sort, son invisibilité prend fin.',
  },
  {
    id: 'poussiere-d-assechement', nom: 'Poussière d’assèchement', categorie: 'merveilleux', rarete: pc, page: 255,
    effet: 'Ce petit sachet contient 1d6 + 4 pincées. Action Utiliser pour en saupoudrer une sur de l’eau : jusqu’à un cube de 4,50 m d’eau se change en une bille de la taille d’une bille, '
      + 'qui flotte ou repose près de l’endroit saupoudré. Son poids est négligeable. Une action Utiliser pour la briser contre une surface dure libère toute l’eau absorbée — '
      + 'ce qui détruit la bille et met fin à sa magie.',
  },
  {
    id: 'poussiere-d-eternuement', nom: 'Poussière d’éternuement et d’étouffement', categorie: 'merveilleux', rarete: pc, page: 255,
    effet: 'Trouvée dans un petit contenant, cette poudre ressemble à la Poussière de disparition, et un Identification la donne pour telle. Il y en a pour un seul usage. '
      + 'Action Utiliser pour la jeter en l’air : toi et chaque créature dans une émanation de 9 m autour de toi faites une sauvegarde de Constitution DD 15. '
      + 'Créatures artificielles, élémentaires, vases, plantes et morts-vivants réussissent d’office. '
      + 'Échec : la créature éternue sans pouvoir s’arrêter, elle est Incapable d’agir et suffoque. Elle refait la sauvegarde à la fin de chacun de ses tours ; '
      + 'un Restauration partielle y met fin aussi.',
  },
  {
    id: 'gemme-elementaire', nom: 'Gemme élémentaire', categorie: 'merveilleux', rarete: pc, page: 257,
    effet: 'Cette gemme contient une parcelle d’énergie élémentaire. Action Utiliser pour la briser : un élémentaire est invoqué et la gemme cesse d’être magique. '
      + 'Il apparaît au plus près, comprend tes langues, obéit à tes ordres et joue juste après toi dans l’initiative. '
      + 'Saphir bleu : élémentaire de l’Air. Émeraude : élémentaire de l’Eau. Corindon rouge : élémentaire du Feu. Diamant jaune : élémentaire de la Terre.',
  },
  {
    id: 'bouteille-fumigene', nom: 'Bouteille fumigène', categorie: 'merveilleux', rarete: pc, page: 259,
    effet: 'Action Magie pour l’ouvrir ou la fermer. Ouverte, une fumée épaisse en sort et remplit une émanation de 18 m autour d’elle ; la zone est Lourdement obscurcie. '
      + 'Chaque minute où elle reste ouverte, l’émanation grandit de 3 m jusqu’à 36 m. '
      + 'La refermer fige le nuage sur place jusqu’à dispersion, au bout de 10 minutes. Un vent fort — un Rafale de vent, par exemple — le disperse en 1 minute.',
  },
  {
    id: 'yeux-de-charme', nom: 'Yeux de charme', categorie: 'merveilleux', rarete: pc, page: 261,
    harmonisation: '',
    effet: 'Ces lentilles de cristal se posent sur les yeux et ont 3 charges. En les portant, tu peux dépenser une ou plusieurs charges pour lancer Charme-personne (DD 13). '
      + 'Pour 1 charge, le sort est de niveau 1 ; chaque charge de plus l’augmente d’un niveau. Elles récupèrent toutes leurs charges à l’aube.',
  },
  {
    id: 'yeux-de-vision-minutieuse', nom: 'Yeux de vision minutieuse', categorie: 'merveilleux', rarete: pc, page: 261,
    effet: 'Ces lentilles de cristal améliorent nettement ta vue jusqu’à 30 cm : tu y as la Vision dans le noir et l’avantage aux tests d’Intelligence (Investigation) '
      + 'pour examiner quelque chose à cette distance.',
  },
  {
    id: 'yeux-de-l-aigle', nom: 'Yeux de l’aigle', categorie: 'merveilleux', rarete: pc, page: 261,
    effet: 'Ces lentilles de cristal te donnent l’avantage aux tests de Sagesse (Perception) fondés sur la vue. '
      + 'Par temps clair, tu distingues les détails de créatures et d’objets très éloignés, jusqu’à 60 cm de large.',
  },
  {
    id: 'gemme-de-clarte', nom: 'Gemme de clarté', categorie: 'merveilleux', rarete: pc, page: 264,
    effet: 'Ce prisme a 50 charges. En le tenant, action Magie et l’un de trois mots de commande. '
      + 'PREMIER : la gemme éclaire vivement sur 9 m et faiblement sur 9 m de plus, sans dépenser de charge ; jusqu’à ce qu’une action bonus répète le mot ou qu’une autre fonction serve. '
      + 'DEUXIÈME : 1 charge, un rayon éblouissant frappe une créature visible à moins de 18 m ; sauvegarde de Constitution DD 15 ou Aveuglée 1 minute, avec un nouveau jet à la fin de chacun de ses tours. '
      + 'TROISIÈME : 5 charges, la gemme s’embrase en un cône de 9 m ; même sauvegarde pour chaque créature dedans.',
  },
  {
    id: 'gemme-de-vision', nom: 'Gemme de vision', categorie: 'merveilleux', rarete: pc, page: 264,
    harmonisation: '',
    effet: 'Cette gemme a 3 charges. Action Magie pour en dépenser 1 : pendant 10 minutes, tu as la Vision véritable jusqu’à 36 m en regardant à travers elle. '
      + 'Elle récupère 1d3 charges à l’aube.',
  },
  {
    id: 'gants-d-interception', nom: 'Gants d’interception', categorie: 'merveilleux', rarete: pc, page: 265,
    harmonisation: '',
    effet: 'Quand une arme à distance ou de jet te touche, tu peux prendre une réaction pour réduire les dégâts de 1d10 + ton modificateur de Dextérité, à condition d’avoir une main libre. '
      + 'Si tu réduis les dégâts à 0, tu peux attraper la munition ou l’arme si elle tient dans cette main.',
  },
  {
    id: 'gants-de-nage-et-d-escalade', nom: 'Gants de nage et d’escalade', categorie: 'merveilleux', rarete: pc, page: 265,
    harmonisation: '',
    effet: 'Tu as une vitesse d’escalade et une vitesse de nage égales à ta vitesse, et +5 aux tests de Force (Athlétisme) pour grimper ou nager.',
  },
  {
    id: 'gants-de-larcin', nom: 'Gants de larcin', categorie: 'merveilleux', rarete: pc, page: 265,
    effet: 'Ces gants sont imperceptibles une fois portés. Ils donnent +5 aux tests de Dextérité pour crocheter une serrure ou faire les poches.',
  },
  {
    id: 'lunettes-de-nuit', nom: 'Lunettes de nuit', categorie: 'merveilleux', rarete: pc, page: 265,
    effet: 'Ces verres sombres te donnent la Vision dans le noir jusqu’à 18 m. Si tu l’as déjà, sa portée augmente de 18 m.',
  },
  {
    id: 'oeil-de-guenaude', nom: 'Œil de guenaude', categorie: 'merveilleux', rarete: pc, page: 265,
    effet: 'Un Œil de guenaude a 3 charges. En le portant ou le tenant, tu peux dépenser 1 charge pour lancer Vision dans le noir (sur toi seul) ou Détection de l’invisible. '
      + 'Il récupère toutes ses charges à l’aube. CAPTEUR DU CONCLAVE : la guenaude qui l’a créé voit ce qu’il voit tant qu’elles sont sur le même plan et qu’elle se concentre. '
      + 'Seul un conclave de guenaudes peut en fabriquer un, et il n’en existe qu’un par conclave.',
  },
  {
    id: 'chapeau-de-deguisement', nom: 'Chapeau de déguisement', categorie: 'merveilleux', rarete: pc, page: 266,
    harmonisation: '',
    effet: 'En le portant, tu peux lancer Déguisement. Le sort prend fin si le chapeau est retiré.',
  },
  {
    id: 'bandeau-d-intellect', nom: 'Bandeau d’intellect', categorie: 'merveilleux', rarete: pc, page: 268,
    harmonisation: '',
    effet: 'Ton Intelligence est de 19 tant que tu le portes. Aucun effet si elle est déjà de 19 ou plus.',
  },
  {
    id: 'heaume-de-comprehension-des-langues', nom: 'Heaume de compréhension des langues', categorie: 'merveilleux', rarete: pc, page: 268,
    effet: 'En le portant, tu peux lancer Compréhension des langues avec.',
  },
  {
    id: 'heaume-de-telepathie', nom: 'Heaume de télépathie', categorie: 'merveilleux', rarete: pc, page: 268,
    harmonisation: '',
    effet: 'En le portant, tu as la télépathie sur 9 m, et tu peux lancer Détection des pensées ou Suggestion (DD 13) avec. '
      + 'Une fois l’un des deux lancé, il ne repart pas avant l’aube suivante.',
  },
  {
    id: 'baton-inamovible', nom: 'Bâton inamovible', categorie: 'sceptre', rarete: pc, page: 270,
    effet: 'Cette tige de fer porte un bouton. Action Utiliser pour l’enfoncer : la tige se fixe magiquement dans l’espace, défiant la gravité, '
      + 'jusqu’à ce que quelqu’un rappuie. Elle supporte jusqu’à 4 tonnes ; au-delà, elle se désactive et tombe. '
      + 'Une action Utiliser et un test de Force (Athlétisme) DD 30 la déplacent de 3 m.',
  },
  {
    id: 'javeline-de-foudre', nom: 'Javeline de foudre', categorie: 'arme', rarete: pc, page: 275,
    support: 'javeline',
    effet: 'Chaque fois que tu touches avec, tu peux choisir d’infliger des dégâts de foudre au lieu de perforants. '
      + 'ÉCLAIR : en la lançant sur une cible à 36 m au plus, tu peux renoncer au jet d’attaque et la changer en trait de foudre — '
      + 'une ligne de 1,50 m de large entre toi et la cible. Chaque créature de la ligne, toi exceptée, fait une sauvegarde de Dextérité DD 13 : '
      + '4d6 dégâts de foudre, la moitié en cas de réussite. La javeline réapparaît aussitôt dans ta main.',
  },
  {
    id: 'onguent-de-keoghtom', nom: 'Onguent de Keoghtom', categorie: 'merveilleux', rarete: pc, page: 275,
    effet: 'Ce bocal de verre de 8 cm contient 1d4 + 1 doses d’un onguent épais qui sent l’aloès. Bocal et contenu pèsent 250 g. '
      + 'Action Utiliser pour en avaler une dose ou l’appliquer sur une créature à moins de 1,50 m : elle récupère 2d8 + 2 PV et cesse d’être Empoisonnée.',
  },
  {
    id: 'luth-de-martelement-tonnant', nom: 'Luth de martèlement tonnant', categorie: 'merveilleux', rarete: pc, page: 275,
    effet: 'Ce luth renforcé se manie comme une massue magique qui inflige 2d8 dégâts de tonnerre supplémentaires. '
      + 'CHANTER ET COGNER : si tu es barde, tu peux utiliser ton modificateur de Charisme au lieu de celui de Force pour attaquer avec, à condition de chanter ou fredonner en frappant.',
  },
  {
    id: 'armure-du-marin', nom: 'Armure du marin', categorie: 'armure', rarete: pc, page: 278,
    support: 'toute armure légère, intermédiaire ou lourde',
    effet: 'Tu as une vitesse de nage égale à ta vitesse. Et si tu commences ton tour sous l’eau à 0 PV, tu récupères aussitôt 1d4 PV. '
      + 'L’armure ne peut plus soigner personne avant l’aube suivante. Elle est décorée de poissons et de coquillages.',
  },
  {
    id: 'medaillon-des-pensees', nom: 'Médaillon des pensées', categorie: 'merveilleux', rarete: pc, page: 278,
    harmonisation: '',
    effet: 'Ce médaillon a 5 charges. En le portant, tu peux en dépenser 1 pour lancer Détection des pensées (DD 13) avec. Il récupère 1d4 charges à l’aube.',
  },
  {
    id: 'manteau-de-la-nature', nom: 'Manteau de la nature', categorie: 'merveilleux', rarete: pc, page: 280,
    harmonisation: 'un druide ou un rôdeur',
    effet: 'Cette cape prend la couleur et la texture du terrain autour de toi. Tu peux t’en servir de focaliseur pour tes sorts de druide et de rôdeur. '
      + 'Et dans une zone Légèrement obscurcie, tu peux te cacher même quand une créature te voit clairement.',
  },
  {
    id: 'collier-d-adaptation', nom: 'Collier d’adaptation', categorie: 'merveilleux', rarete: pc, page: 280,
    harmonisation: '',
    effet: 'Tu respires normalement dans n’importe quel environnement, et tu as l’avantage aux sauvegardes pour éviter ou mettre fin à l’état Empoisonné.',
  },
  {
    id: 'huile-de-glissance', nom: 'Huile de glissance', categorie: 'potion', rarete: pc, page: 283,
    effet: 'Une fiole couvre une créature de taille M ou moins, équipement compris — une fiole de plus par catégorie de taille au-dessus. '
      + 'L’application prend 10 minutes ; la créature gagne ensuite l’effet du sort Liberté de mouvement pendant 8 heures. '
      + 'On peut aussi la verser au sol : elle couvre alors un carré de 3 m de côté en terrain difficile et glissant pendant 8 heures.',
  },
  {
    id: 'perle-de-puissance', nom: 'Perle de puissance', categorie: 'merveilleux', rarete: pc, page: 284,
    harmonisation: 'un lanceur de sorts',
    effet: 'Tant que la perle est sur toi, action Magie pour récupérer un emplacement de sort dépensé de niveau 3 ou moins. Plus rien avant l’aube suivante.',
  },
  {
    id: 'amulette-de-sante', nom: 'Amulette de santé', categorie: 'merveilleux', rarete: pc, page: 284,
    harmonisation: '',
    effet: 'En portant ce pendentif, action Magie pour récupérer 2d4 + 2 PV — plus rien avant l’aube suivante. '
      + 'Tu as aussi l’avantage aux sauvegardes pour éviter ou mettre fin à l’état Empoisonné.',
  },
  {
    id: 'amulette-de-fermeture-des-plaies', nom: 'Amulette de fermeture des plaies', categorie: 'merveilleux', rarete: pc, page: 284,
    harmonisation: '',
    effet: 'PRÉSERVATION DE LA VIE : quand tu fais un jet de sauvegarde contre la mort, tu peux changer un résultat de 9 ou moins en 10 — un échec devient une réussite. '
      + 'STABILISATION : quand tu tombes à 0 PV sans mourir sur le coup, tu peux prendre une réaction pour te stabiliser.',
  },
  {
    id: 'philtre-d-amour', nom: 'Philtre d’amour', categorie: 'potion', rarete: pc, page: 285,
    effet: 'La prochaine créature que tu vois dans les 10 minutes qui suivent te Charme pendant 1 heure. '
      + 'Ce liquide rosé et pétillant contient une bulle en forme de cœur, facile à manquer.',
  },
  {
    id: 'flute-hantee', nom: 'Flûte hantée', categorie: 'merveilleux', rarete: pc, page: 285,
    effet: 'Ces flûtes ont 3 charges et en récupèrent 1d3 à l’aube. Action Magie pour en jouer et dépenser 1 charge : un air envoûtant s’élève. '
      + 'Chaque créature de ton choix à moins de 9 m doit réussir une sauvegarde de Sagesse DD 15 ou être Effrayée pendant 1 minute, '
      + 'avec un nouveau jet à la fin de chacun de ses tours. Une créature qui réussit est immunisée à ces flûtes pendant 24 heures.',
  },
  {
    id: 'flute-des-egouts', nom: 'Flûte des égouts', categorie: 'merveilleux', rarete: pc, page: 285,
    harmonisation: '',
    effet: 'Tant que ces flûtes sont sur toi, les rats ordinaires et les rats géants te sont Indifférents et ne t’attaquent pas, sauf si tu les menaces ou les blesses. '
      + 'Elles ont 3 charges et en récupèrent 1d3 à l’aube. En jouant par une action Magie, tu peux prendre une action bonus pour dépenser 1 à 3 charges : '
      + 'chaque charge appelle une Nuée de rats, s’il y a assez de rats dans un rayon de 800 m (le MJ en juge). Sinon la charge est perdue. '
      + 'Les nuées appelées viennent vers la musique par le plus court chemin, mais ne sont pas sous ton contrôle.',
  },
  {
    id: 'potion-d-amitie-animale', nom: 'Potion d’amitié animale', categorie: 'potion', rarete: pc, page: 287,
    effet: 'Tu peux lancer la version de niveau 3 du sort Amitié avec les animaux (DD 13). '
      + 'En agitant ce liquide boueux, on aperçoit des choses : une écaille de poisson, une plume de colibri, une griffe de chat, un poil d’écureuil.',
  },
  {
    id: 'potion-de-souffle-de-feu', nom: 'Potion de souffle de feu', categorie: 'potion', rarete: pc, page: 287,
    effet: 'Après l’avoir bue, tu peux prendre une action bonus pour cracher du feu sur une cible à moins de 9 m : '
      + 'sauvegarde de Dextérité DD 13, 4d6 dégâts de feu, la moitié en cas de réussite. '
      + 'L’effet cesse après trois souffles ou au bout d’1 heure. Le liquide orange vacille, et de la fumée s’échappe dès qu’on ouvre le flacon.',
  },
  {
    id: 'potion-de-longevite', nom: 'Potion de longévité', categorie: 'potion', rarete: pc, page: 288,
    effet: 'Ton âge physique diminue de 1d6 + 6 ans, sans descendre sous 13 ans. '
      + 'À chaque nouvelle Potion de longévité bue ensuite, il y a 10 % de chances cumulatives que tu VIEILLISSES au contraire de 1d6 + 6 ans.',
  },
  {
    id: 'potion-de-poison', nom: 'Potion de poison', categorie: 'potion', rarete: pc, page: 288,
    effet: 'Cette mixture a l’aspect, l’odeur et le goût d’une potion de soins ou d’une autre potion bénéfique — un Identification la donne pour telle. '
      + 'Bue ou versée sur une blessure : sauvegarde de Constitution DD 13, 3d6 dégâts de poison et l’état Empoisonné pendant 1 heure ; '
      + 'la moitié des dégâts et pas d’état en cas de réussite. Empoisonnée ainsi, la créature refait le jet à la fin de chacun de ses tours.',
  },
  {
    id: 'potion-de-pugilat', nom: 'Potion de pugilat', categorie: 'potion', rarete: pc, page: 289,
    effet: 'Chacune de tes attaques à mains nues inflige 1d6 dégâts de force supplémentaires sur un coup au but, pendant 10 minutes. '
      + 'Ce liquide vert et épais a le goût des épinards.',
  },
  {
    id: 'potion-de-resistance', nom: 'Potion de résistance', categorie: 'potion', rarete: pc, page: 289,
    effet: 'Tu résistes à un type de dégâts pendant 1 heure. Le MJ le choisit, ou le tire sur 1d10 : '
      + 'acide, froid, feu, force, foudre, nécrotique, poison, psychique, radiant, tonnerre.',
  },
  {
    id: 'potion-de-respiration-aquatique', nom: 'Potion de respiration aquatique', categorie: 'potion', rarete: pc, page: 289,
    effet: 'Tu respires sous l’eau pendant 24 heures. Ce liquide vert trouble sent la mer, et une bulle qui ressemble à une méduse y flotte.',
  },
  {
    id: 'carquois-d-ehlonna', nom: 'Carquois d’Ehlonna', categorie: 'merveilleux', rarete: pc, page: 291,
    effet: 'Chacun des trois compartiments de ce carquois ouvre sur un espace extradimensionnel : il porte beaucoup sans jamais peser plus de 1 kg. '
      + 'Le plus court tient 60 flèches, carreaux ou objets semblables ; le moyen, 18 javelines ou objets semblables ; '
      + 'le plus long, 6 objets longs — arcs, bâtons, lances. Tu en tires ce que tu veux comme d’un carquois ordinaire.',
  },
  {
    id: 'anneau-de-saut', nom: 'Anneau de saut', categorie: 'anneau', rarete: pc, page: 293,
    harmonisation: '',
    effet: 'Tu peux lancer Saut avec, mais seulement sur toi-même.',
  },
  {
    id: 'anneau-de-protection-mentale', nom: 'Anneau de protection mentale', categorie: 'anneau', rarete: pc, page: 293,
    harmonisation: '',
    effet: 'Tu es immunisé à la magie qui permet de lire tes pensées, de savoir si tu mens, de connaître ton alignement ou ton type de créature. '
      + 'On ne peut te parler par télépathie que si tu l’autorises. '
      + 'Action Magie pour rendre l’anneau imperceptible, jusqu’à ce qu’une autre action Magie le rende visible, que tu le retires, ou que tu meures.',
  },
  {
    id: 'anneau-de-nage', nom: 'Anneau de nage', categorie: 'anneau', rarete: pc, page: 295,
    effet: 'Tu as une vitesse de nage de 12 m tant que tu le portes.',
  },
  {
    id: 'anneau-de-marche-sur-l-eau', nom: 'Anneau de marche sur l’eau', categorie: 'anneau', rarete: pc, page: 296,
    effet: 'Tu peux lancer Marche sur l’eau avec, sur toi seul.',
  },
  {
    id: 'anneau-de-chaleur', nom: 'Anneau de chaleur', categorie: 'anneau', rarete: pc, page: 296,
    harmonisation: '',
    effet: 'Quand tu subis des dégâts de froid en le portant, l’anneau les réduit de 2d8. '
      + 'Et toi, ce que tu portes et ce que tu transportes ne craignez pas les températures de −18 °C ou moins.',
  },
  {
    id: 'robe-aux-objets-utiles', nom: 'Robe aux objets utiles', categorie: 'merveilleux', rarete: pc, page: 298,
    effet: 'Cette robe est couverte de pièces de tissu de formes et de couleurs variées. Action Magie pour en détacher une : elle devient l’objet ou la créature qu’elle représente. '
      + 'Une fois la dernière pièce retirée, la robe redevient un vêtement ordinaire. '
      + 'Elle porte deux exemplaires de chacun : lanterne à capote (allumée), dague, miroir de poche, perche de 3 m, échelle de corde, sac. '
      + 'Elle porte en plus 1d4 pièces tirées au hasard sur la table du Guide — bourse de pièces, feu de camp, fosse, chevaux de trait, et jusqu’à un portail unidirectionnel.',
  },
  {
    id: 'sceptre-du-gardien-du-pacte', nom: 'Sceptre du gardien du pacte +1, +2 ou +3', categorie: 'sceptre', rarete: pc, page: 301,
    harmonisation: 'un occultiste',
    effet: 'En le tenant, tu gagnes un bonus à tes jets d’attaque de sort et aux DD de sauvegarde de tes sorts d’occultiste, déterminé par la rareté du sceptre '
      + '(peu commun pour +1, rare pour +2, très rare pour +3). '
      + 'De plus, tu peux récupérer un emplacement de sort d’occultiste dépensé en finissant un repos court. Plus rien avant un repos long.',
  },
  {
    id: 'corde-d-escalade', nom: 'Corde d’escalade', categorie: 'merveilleux', rarete: pc, page: 301,
    effet: 'Ces 18 m de corde supportent jusqu’à 1,4 tonne. En tenant un bout, action Magie pour commander à l’autre de s’animer et de gagner un point que tu choisis, '
      + 'dans la limite de la longueur de la corde. Ce bout avance de 3 m à ton tour. '
      + 'La corde peut aussi se nouer et se dénouer d’elle-même sur ordre, et se transformer en échelle de corde.',
  },
  {
    id: 'selle-du-cavalier', nom: 'Selle du cavalier', categorie: 'merveilleux', rarete: pc, page: 302,
    effet: 'Tant que tu es assis dessus, en selle : MONTURE PROTÉGÉE, les jets d’attaque contre ta monture sont désavantagés. '
      + 'CAVALIER ASSURÉ, on ne peut pas te désarçonner contre ta volonté — sauf si tu es Incapable d’agir.',
  },
  {
    id: 'pierres-de-message', nom: 'Pierres de message', categorie: 'merveilleux', rarete: pc, page: 303,
    effet: 'Ces pierres vont par paires, chacune taillée pour répondre à l’autre. En touchant l’une, tu peux lancer Message par elle ; la cible est le porteur de l’autre. '
      + 'Si personne ne la porte, tu le sais aussitôt et le sort n’est pas lancé. '
      + 'Une fois le sort lancé par l’une ou l’autre, les pierres ne resservent pas avant l’aube. Si une pierre est détruite, l’autre perd sa magie.',
  },
  {
    id: 'bouclier-vigile', nom: 'Bouclier vigile', categorie: 'bouclier', rarete: pc, page: 303,
    effet: 'En le portant, tu as l’avantage aux jets d’initiative et aux tests de Sagesse (Perception). Il est frappé d’un œil.',
  },
  {
    id: 'bouclier-plus', nom: 'Bouclier +1, +2 ou +3', categorie: 'bouclier', rarete: pc, page: 303,
    effet: 'En le portant, tu gagnes un bonus à la classe d’armure, qui s’ajoute à celui que le bouclier donne normalement. '
      + 'Le bonus suit la rareté : peu commun pour +1, rare pour +2, très rare pour +3.',
  },
  {
    id: 'chaussons-d-escalade-arachneenne', nom: 'Chaussons d’escalade arachnéenne', categorie: 'merveilleux', rarete: pc, page: 304,
    harmonisation: '',
    effet: 'Tu peux te déplacer sur les surfaces verticales et au plafond, les mains libres, en gardant ta vitesse de marche. '
      + 'Sans effet sur une surface trop glissante, comme une paroi couverte de glace ou d’huile.',
  },
  {
    id: 'baton-de-la-vipere', nom: 'Bâton de la vipère', categorie: 'baton', rarete: pc, page: 309,
    harmonisation: '',
    effet: 'Action bonus pour changer la tête de ce bâton en tête de serpent venimeux animée pendant 1 minute, ou la rendre inerte. '
      + 'Quand tu prends l’action Attaquer, tu peux faire un des jets d’attaque avec la tête animée, allonge 1,50 m, '
      + 'en appliquant ton bonus de maîtrise et ton modificateur de Sagesse. Coup au but : 1d6 dégâts perforants et 3d6 dégâts de poison.',
  },
  {
    id: 'baton-du-python', nom: 'Bâton du python', categorie: 'baton', rarete: pc, page: 311,
    harmonisation: '',
    effet: 'Action Magie pour le lancer dans un espace libre à moins de 3 m : il devient un Serpent constricteur géant, sous ton contrôle, qui partage ton initiative et joue juste après toi. '
      + 'À ton tour, tu le commandes mentalement s’il est à moins de 18 m et que tu n’es pas Incapable d’agir (aucune action requise). '
      + 'Réduit à 0 PV, le serpent redevient un bâton et ne peut plus être réveillé pendant 7 jours.',
  },
  {
    id: 'pierre-de-chance', nom: 'Pierre de chance', categorie: 'merveilleux', rarete: pc, page: 312,
    harmonisation: '',
    effet: 'Tant que cette agate polie est sur toi, tu gagnes +1 aux tests de caractéristique et aux jets de sauvegarde.',
  },
  {
    id: 'epee-de-vengeance', nom: 'Épée de vengeance', categorie: 'arme', rarete: pc, page: 314,
    support: 'coutille, épée à deux mains, épée longue, rapière, cimeterre ou épée courte',
    harmonisation: '',
    effet: 'Tu gagnes +1 aux jets d’attaque et de dégâts avec cette arme. '
      + 'MALÉDICTION : elle est maudite, habitée par un esprit vengeur. S’y harmoniser étend la malédiction à toi. '
      + 'Tant que tu es maudit, tu refuses de te séparer de l’épée et tu as le désavantage aux jets d’attaque avec toute autre arme. '
      + 'Seul un Délivrance des malédictions ou une magie équivalente rompt la malédiction.',
  },
  {
    id: 'trident-du-commandement-des-poissons', nom: 'Trident du commandement des poissons', categorie: 'arme', rarete: pc, page: 317,
    support: 'trident',
    harmonisation: '',
    effet: 'Cette arme a 3 charges et en récupère 1d3 à l’aube. En la portant, tu peux dépenser 1 charge pour lancer Domination de bête (DD 15) '
      + 'sur une bête qui a une vitesse de nage.',
  },
  {
    id: 'baguette-de-detection-de-la-magie', nom: 'Baguette de détection de la magie', categorie: 'baguette', rarete: pc, page: 320,
    effet: 'Cette baguette a 3 charges. En la tenant, tu peux en dépenser 1 pour lancer Détection de la magie avec. Elle récupère 1d3 charges à l’aube.',
  },
  {
    id: 'baguette-de-projectiles-magiques', nom: 'Baguette de projectiles magiques', categorie: 'baguette', rarete: pc, page: 320,
    effet: 'Cette baguette a 7 charges. En la tenant, tu peux dépenser jusqu’à 3 charges pour lancer Projectile magique avec : '
      + 'pour 1 charge, la version de niveau 1 ; chaque charge de plus monte le sort d’un niveau. '
      + 'Elle récupère 1d6 + 1 charges à l’aube. Si tu dépenses la dernière, lance 1d20 : sur un 1, elle tombe en cendres et est détruite.',
  },
  {
    id: 'baguette-des-secrets', nom: 'Baguette des secrets', categorie: 'baguette', rarete: pc, page: 322,
    effet: 'Cette baguette a 3 charges et en récupère 1d3 à l’aube. En la tenant, action Magie pour dépenser 1 charge : '
      + 's’il y a une porte secrète ou un piège à moins de 18 m de toi, elle vibre et pointe le plus proche.',
  },
  {
    id: 'baguette-du-mage-de-guerre', nom: 'Baguette du mage de guerre +1, +2 ou +3', categorie: 'baguette', rarete: pc, page: 322,
    harmonisation: 'un lanceur de sorts',
    effet: 'En la tenant, tu gagnes un bonus à tes jets d’attaque de sort, déterminé par la rareté de la baguette '
      + '(peu commune pour +1, rare pour +2, très rare pour +3). '
      + 'De plus, tu ignores l’abri partiel quand tu fais un jet d’attaque de sort.',
  },
  {
    id: 'baguette-de-toile-d-araignee', nom: 'Baguette de toile d’araignée', categorie: 'baguette', rarete: pc, page: 322,
    harmonisation: 'un lanceur de sorts',
    effet: 'Cette baguette a 7 charges. En la tenant, tu peux dépenser 1 charge pour lancer Toile d’araignée (DD 13) avec. '
      + 'Elle récupère 1d6 + 1 charges à l’aube. Si tu dépenses la dernière, lance 1d20 : sur un 1, elle tombe en cendres et est détruite.',
  },
  {
    id: 'arme-plus', nom: 'Arme +1, +2 ou +3', categorie: 'arme', rarete: pc, page: 324,
    support: 'toute arme simple ou de guerre',
    effet: 'Tu gagnes un bonus aux jets d’attaque et de dégâts faits avec cette arme magique. '
      + 'Le bonus suit la rareté : peu commune pour +1, rare pour +2, très rare pour +3.',
  },
  {
    id: 'arme-d-avertissement', nom: 'Arme d’avertissement', categorie: 'arme', rarete: pc, page: 324,
    support: 'toute arme simple ou de guerre',
    harmonisation: '',
    effet: 'Tant que l’arme est à ta portée et que tu y es harmonisé, toi et tes alliés à moins de 9 m gagnez ceci. '
      + 'ALARME : l’arme réveille chacun de vous qui dort naturellement dès que le combat commence — mais pas d’un sommeil magique. '
      + 'PROMPTITUDE SURNATURELLE : chacun a l’avantage à ses jets d’initiative.',
  },
  {
    id: 'eventail-de-vent', nom: 'Éventail de vent', categorie: 'merveilleux', rarete: pc, page: 325,
    effet: 'En le tenant, tu peux lancer Rafale de vent (DD 13) avec. À chaque nouvel usage avant l’aube suivante, il y a 20 % de chances cumulatives '
      + 'qu’il ne fonctionne pas — et s’il rate, il se déchire en lambeaux sans magie.',
  },
  {
    id: 'bottes-ailees', nom: 'Bottes ailées', categorie: 'merveilleux', rarete: pc, page: 325,
    harmonisation: '',
    effet: 'Tu as une vitesse de vol égale à ta vitesse de marche. Tu peux voler ainsi jusqu’à 4 heures, d’un coup ou par tranches d’au moins 1 minute. '
      + 'Épuisées, les bottes ne revolent plus jusqu’à ce qu’elles aient récupéré : elles regagnent 2 heures de vol par tranche de 12 heures sans voler.',
  },
  {
    id: 'bandes-de-puissance-a-mains-nues', nom: 'Bandes de puissance à mains nues +1, +2 ou +3', categorie: 'merveilleux', rarete: pc, page: 325,
    harmonisation: '',
    effet: 'En les portant, tu gagnes un bonus aux jets d’attaque et de dégâts de tes attaques à mains nues, déterminé par la rareté des bandes '
      + '(peu communes pour +1, rares pour +2, très rares pour +3).',
  },

  // ═════════ Ceux dont la rareté vit dans un TABLEAU ═════════
  //
  // Ces dix-là avaient échappé au premier passage, et pour une raison qui se
  // répète : leur rareté n'est pas sur la ligne de type sous le nom, elle est
  // dans un tableau à l'intérieur de l'entrée — « Potion of Healing … Common »,
  // « Cantrip … Common ». L'ancre automatique ne pouvait pas les voir.
  //
  // Ils ont été retrouvés en cherchant les entrées marquées « Rarity Varies »
  // dans tout le chapitre, puis en lisant chaque tableau. C'est ce passage qui
  // a rattrapé la POTION DE SOINS et le PARCHEMIN DE SORT — les deux objets
  // qu'un MJ donne le plus souvent.
  {
    id: 'potion-de-soins', nom: 'Potion de soins', categorie: 'potion', rarete: c, page: 288,
    effet: 'Tu récupères 2d4 + 2 points de vie en la buvant. Le liquide rouge scintille quand on l’agite. '
      + 'Trois versions plus puissantes existent : supérieure (4d4 + 4, peu commune), extra (8d4 + 8, rare) et suprême (10d4 + 20, très rare).',
  },
  {
    id: 'parchemin-de-sort-mineur', nom: 'Parchemin de sort (tour de magie ou niveau 1)', categorie: 'parchemin', rarete: c, page: 305,
    effet: 'Un parchemin porte les mots d’un seul sort, en écriture chiffrée. Si le sort est sur ta liste, tu peux le lire et le lancer sans composante matérielle — '
      + 'le lancer prend son temps d’incantation habituel, et le parchemin tombe en poussière. Interrompu, il n’est pas perdu. '
      + 'Si le sort est sur ta liste mais d’un niveau que tu ne peux pas lancer, fais un test de ta caractéristique d’incantation, DD 10 + le niveau du sort ; '
      + 'raté, le sort disparaît sans autre effet. '
      + 'Pour un tour de magie ou un sort de niveau 1 : DD de sauvegarde 13, bonus d’attaque +5.',
  },
  {
    id: 'potion-de-soins-superieure', nom: 'Potion de soins supérieure', categorie: 'potion', rarete: pc, page: 288,
    effet: 'Tu récupères 4d4 + 4 points de vie en la buvant. Le liquide rouge scintille quand on l’agite.',
  },
  {
    id: 'parchemin-de-sort-moyen', nom: 'Parchemin de sort (niveau 2 ou 3)', categorie: 'parchemin', rarete: pc, page: 305,
    effet: 'Mêmes règles que le parchemin de niveau inférieur : lisible seulement si le sort est sur ta liste, lancé sans composante matérielle, '
      + 'le parchemin tombe en poussière. Au-dessus de ton niveau de lancement, test de ta caractéristique d’incantation DD 10 + le niveau du sort. '
      + 'Niveau 2 : DD de sauvegarde 13, bonus d’attaque +5. Niveau 3 : DD 15, bonus +7.',
  },
  {
    id: 'potion-de-force-de-geant-collines', nom: 'Potion de force de géant (des collines)', categorie: 'potion', rarete: pc, page: 288,
    effet: 'Ton score de Force passe à 21 pendant 1 heure. Sans effet si ta Force est déjà égale ou supérieure. '
      + 'Le liquide transparent contient un éclat de lumière qui ressemble à un ongle de géant. '
      + 'Les versions supérieures — givre ou pierre (23), feu (25), nuages (27), tempête (29) — sont rares ou davantage.',
  },
  {
    id: 'armure-ensorcelee', nom: 'Armure ensorcelée (tour de magie ou niveau 1)', categorie: 'armure', rarete: pc, page: 258,
    support: 'toute armure légère, intermédiaire ou lourde',
    harmonisation: '',
    effet: 'Un sort d’Abjuration ou d’Illusion est lié à cette armure, fixé à sa fabrication. Elle a 6 charges et en récupère 1d6 à l’aube. '
      + 'En la portant, tu peux dépenser 1 charge pour lancer ce sort. '
      + 'Avec un tour de magie ou un sort de niveau 1 : DD de sauvegarde 13, bonus d’attaque +5. '
      + 'Au-delà, l’armure devient rare (niveaux 2-3) puis très rare (4-5).',
  },
  {
    id: 'arme-ensorcelee', nom: 'Arme ensorcelée (tour de magie ou niveau 1)', categorie: 'arme', rarete: pc, page: 258,
    support: 'toute arme simple ou de guerre',
    harmonisation: '',
    effet: 'Un sort d’Invocation, de Divination, d’Évocation, de Nécromancie ou de Transmutation est lié à cette arme, fixé à sa fabrication. '
      + 'Elle a 6 charges et en récupère 1d6 à l’aube. En la tenant, tu peux dépenser 1 charge pour lancer ce sort. '
      + 'Avec un tour de magie ou un sort de niveau 1 : DD de sauvegarde 13, bonus d’attaque +5. '
      + 'Au-delà, l’arme devient rare (niveaux 2-3) puis très rare (4-5).',
  },
  {
    id: 'baton-ensorcele', nom: 'Bâton ensorcelé (tour de magie ou niveau 1)', categorie: 'baton', rarete: pc, page: 258,
    harmonisation: 'un lanceur de sorts',
    effet: 'Un sort est lié à ce bâton, fixé à sa fabrication. Il a 6 charges et en récupère 1d6 à l’aube. '
      + 'En le tenant, tu peux dépenser 1 charge pour lancer ce sort. '
      + 'Avec un tour de magie ou un sort de niveau 1 : DD de sauvegarde 13, bonus d’attaque +5. '
      + 'Au-delà, le bâton devient rare (niveaux 2-3) puis très rare (4-5).',
  },
  {
    id: 'jeton-plume-de-quaal', nom: 'Jeton-plume de Quaal (ancre, éventail ou arbre)', categorie: 'merveilleux', rarete: pc, page: 290,
    effet: 'Cet objet ressemble à une plume et sert une seule fois. Trois de ses six types sont peu communs. '
      + 'ANCRE : action Magie pour la toucher à un bateau ; pendant 24 heures, rien ne peut le déplacer. La retoucher met fin à l’effet et le jeton disparaît. '
      + 'ÉVENTAIL : à bord d’un bateau, action Magie pour le lancer à 3 m en l’air ; un éventail géant apparaît et lève un vent qui gonfle les voiles d’un navire, '
      + '+8 km/h pendant 8 heures. Tu peux le congédier par une action Magie. '
      + 'ARBRE : en extérieur, action Magie pour le toucher à un espace libre au sol ; un chêne non magique de 18 m de haut y pousse. '
      + 'Les trois autres types — oiseau, cygne, fouet — sont rares.',
  },
  {
    id: 'instrument-des-bardes', nom: 'Instrument des bardes (luth de Doss, bandore de Fochlucan, cistre de Mac-Fuirmidh)', categorie: 'merveilleux', rarete: pc, page: 272,
    harmonisation: 'un barde',
    effet: 'Meilleur en tout point qu’un instrument ordinaire. Sept types existent, chacun nommé d’après un collège bardique ; trois sont peu communs. '
      + 'Qui tente d’en jouer sans y être harmonisé doit réussir une sauvegarde de Sagesse DD 15, sinon 2d4 dégâts psychiques. '
      + 'Tous permettent de lancer Vol, Invisibilité, Lévitation et Protection contre le mal et le bien, plus les sorts propres à l’instrument : '
      + 'le LUTH DE DOSS ajoute Amitié avec les animaux et Protection contre l’énergie (feu seulement) ; '
      + 'la BANDORE DE FOCHLUCAN ajoute Protection contre le poison, Enchevêtrement et Lueurs féeriques ; '
      + 'le CISTRE DE MAC-FUIRMIDH ajoute Gourdin magique et Communication avec les animaux.',
  },
];

/** Les objets d'une rareté, rangés par nom. */
export const objetsParRarete = (rarete: Rarete): ObjetMagique[] =>
  OBJETS_MAGIQUES.filter((objet) => objet.rarete === rarete)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

const sansAccent = (texte: string): string =>
  texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Une recherche simple sur le nom, sans accent ni casse. */
export const chercherObjet = (question: string): ObjetMagique[] =>
  filtrerObjets({ question });

/**
 * Ce qu'on peut demander au catalogue.
 *
 * Ces trois-là, et pas d'autres, parce qu'ils répondent aux trois questions
 * qu'un MJ se pose en composant un butin : qu'est-ce que je peux donner à ce
 * niveau (rareté), qu'est-ce qui irait à CE personnage (catégorie), et
 * est-ce que ça va lui coûter un de ses trois emplacements d'harmonisation.
 */
export type FiltreObjets = {
  question?: string;
  raretes?: Rarete[];
  categories?: CategorieObjet[];
  /** `true` : seulement ce qui demande une harmonisation. `false` : seulement ce qui n'en demande pas. */
  harmonisation?: boolean;
};

export function filtrerObjets(filtre: FiltreObjets): ObjetMagique[] {
  const cible = sansAccent((filtre.question ?? '').trim());
  return OBJETS_MAGIQUES
    .filter((objet) => {
      if (cible && !sansAccent(objet.nom).includes(cible)) return false;
      if (filtre.raretes?.length && !filtre.raretes.includes(objet.rarete)) return false;
      if (filtre.categories?.length && !filtre.categories.includes(objet.categorie)) return false;
      if (filtre.harmonisation !== undefined
        && (objet.harmonisation !== undefined) !== filtre.harmonisation) return false;
      return true;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/**
 * Les catégories réellement présentes, avec leur effectif — pour ne pas
 * proposer un filtre « Sceptre » qui rendrait deux objets, ni un filtre vide.
 */
export function categoriesPresentes(objets: ObjetMagique[] = OBJETS_MAGIQUES): { categorie: CategorieObjet; nombre: number }[] {
  const compte = new Map<CategorieObjet, number>();
  for (const objet of objets) compte.set(objet.categorie, (compte.get(objet.categorie) ?? 0) + 1);
  return [...compte.entries()]
    .map(([categorie, nombre]) => ({ categorie, nombre }))
    .sort((a, b) => b.nombre - a.nombre || LIBELLE_CATEGORIE[a.categorie].localeCompare(LIBELLE_CATEGORIE[b.categorie], 'fr'));
}

/** Ce qui vaut d'être rappelé sous la liste, sur le rythme de distribution. */
export const NOTE_COMMUNS =
  'Le commun et le peu commun sont ce qu’un groupe croise avant le niveau 5 : le commun amuse sans rien déséquilibrer, '
  + 'le peu commun commence à peser. Le rare et au-delà viendront par lots.';

export const RAPPEL_HARMONISATION =
  'On ne porte que trois objets harmonisés à la fois. C’est le seul chiffre qui limite vraiment un personnage, '
  + 'et c’est celui qu’on oublie en distribuant.';
