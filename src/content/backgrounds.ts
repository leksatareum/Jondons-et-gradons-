/**
 * Les seize origines du PHB 2024. Repêché de
 * `table-connectee/src/App.jsx` (`BACKGROUNDS`). Confiance haute sur la
 * liste (seize entrées, correspond aux origines officielles), moyenne sur
 * le détail de chaque kit de départ — pas confirmé objet par objet contre
 * le PHB papier.
 *
 * Chaque origine accorde : trois caractéristiques au choix pour la Ligne
 * de vie, deux compétences, une maîtrise d'outil (fixe ou au choix dans une
 * catégorie), un don d'origine, et un équipement de départ (ou son
 * équivalent en pièces d'or).
 */

export interface BackgroundKitItem {
  name: string;
  qty: number;
  weight: number;
  desc: string;
}

export interface BackgroundDef {
  id: string;
  name: string;
  /** Les trois caractéristiques proposées pour la Ligne de vie (+2/+1 ou +1/+1/+1). */
  abilities: [string, string, string];
  skills: [string, string];
  feat: string;
  /** Id du don d'origine dans `src/content/feats.ts`. */
  featId: string;
  /** Sort de cantrip supplémentaire si le don est Initié à la magie, selon la liste de classe indiquée. */
  magicList?: string;
  /** Maîtrise d'outil fixe, si l'origine n'en laisse pas le choix. */
  tool?: string;
  /** Catégorie dans laquelle choisir l'outil, si l'origine laisse le choix. */
  toolChoice?: 'artisan' | 'instrument' | 'gaming';
  /** Or reçu si le personnage prend l'équivalent en pièces plutôt que le kit. */
  kitGold: number;
  kit: BackgroundKitItem[];
}

const item = (name: string, qty = 1, weight = 0, desc = ''): BackgroundKitItem => ({ name, qty, weight, desc });

export const BACKGROUNDS: BackgroundDef[] = [
  { featId: 'initie', magicList: 'clerc', id: 'acolyte', name: 'Acolyte', abilities: ['int', 'wis', 'cha'], skills: ['intuition', 'religion'], feat: 'Initié à la magie (Clerc)', tool: 'Matériel de calligraphe', kitGold: 8, kit: [item('Matériel de calligraphe', 1, 2.5), item('Livre de prières', 1, 2.5), item('Symbole sacré'), item('Feuille de parchemin', 10), item('Robe', 1, 2)] },
  { featId: 'artisan', id: 'artisan', name: 'Artisan', abilities: ['str', 'dex', 'int'], skills: ['investigation', 'persuasion'], feat: 'Artisan', toolChoice: 'artisan', kitGold: 32, kit: [item("Outils d'artisan choisis", 1, 3), item('Sacoche', 2, 0.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'doue', id: 'charlatan', name: 'Charlatan', abilities: ['dex', 'con', 'cha'], skills: ['tromperie', 'escamotage'], feat: 'Doué', tool: 'Nécessaire de contrefaçon', kitGold: 15, kit: [item('Nécessaire de contrefaçon', 1, 2.5), item('Déguisement', 1, 2), item('Tenue raffinée', 1, 3)] },
  { featId: 'vigilant', id: 'criminel', name: 'Criminel', abilities: ['dex', 'con', 'int'], skills: ['escamotage', 'discretion'], feat: 'Vigilant', tool: 'Outils de voleur', kitGold: 16, kit: [item('Dague', 2, 0.5), item('Outils de voleur', 1, 0.5), item('Pied-de-biche', 1, 2.5), item('Sacoche', 2, 0.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'musicien', id: 'artiste', name: 'Artiste', abilities: ['str', 'dex', 'cha'], skills: ['acrobaties', 'representation'], feat: 'Musicien', toolChoice: 'instrument', kitGold: 11, kit: [item('Instrument de musique choisi', 1, 1), item('Déguisement', 2, 2), item('Miroir'), item('Parfum'), item('Tenue de voyage', 1, 2)] },
  { featId: 'robuste', id: 'fermier', name: 'Fermier', abilities: ['str', 'con', 'wis'], skills: ['dressage', 'nature'], feat: 'Robuste', tool: 'Outils de charpentier', kitGold: 30, kit: [item('Faucille', 1, 1), item('Outils de charpentier', 1, 3), item('Trousse de soins', 1, 1.5), item('Marmite en fer', 1, 5), item('Pelle', 1, 2.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'vigilant', id: 'garde', name: 'Garde', abilities: ['str', 'int', 'wis'], skills: ['athletisme', 'perception'], feat: 'Vigilant', toolChoice: 'gaming', kitGold: 12, kit: [item('Lance', 1, 1.5), item('Arbalète légère', 1, 2.5), item('Carreau', 20), item('Jeu choisi'), item('Lanterne à capote', 1, 1), item('Menottes', 1, 3), item('Carquois', 1, 0.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'initie', magicList: 'druide', id: 'guide', name: 'Guide', abilities: ['dex', 'con', 'wis'], skills: ['discretion', 'survie'], feat: 'Initié à la magie (Druide)', tool: 'Outils de cartographe', kitGold: 3, kit: [item('Arc court', 1, 1), item('Flèche', 20), item('Outils de cartographe', 1, 3), item('Sac de couchage', 1, 3.5), item('Carquois', 1, 0.5), item('Tente', 1, 10), item('Tenue de voyage', 1, 2)] },
  { featId: 'guerisseur', id: 'ermite', name: 'Ermite', abilities: ['con', 'wis', 'cha'], skills: ['medecine', 'religion'], feat: 'Guérisseur', tool: "Nécessaire d'herboriste", kitGold: 16, kit: [item('Bâton', 1, 2), item("Nécessaire d'herboriste", 1, 1.5), item('Sac de couchage', 1, 3.5), item('Livre de philosophie', 1, 2.5), item('Lampe', 1, 0.5), item("Flasque d'huile", 3, 0.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'chanceux', id: 'marchand', name: 'Marchand', abilities: ['con', 'int', 'cha'], skills: ['dressage', 'persuasion'], feat: 'Chanceux', tool: 'Outils de navigateur', kitGold: 22, kit: [item('Outils de navigateur', 1, 1), item('Sacoche', 2, 0.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'doue', id: 'noble', name: 'Noble', abilities: ['str', 'int', 'cha'], skills: ['histoire', 'persuasion'], feat: 'Doué', toolChoice: 'gaming', kitGold: 29, kit: [item('Jeu choisi'), item('Tenue raffinée', 1, 3), item('Parfum')] },
  { featId: 'initie', magicList: 'magicien', id: 'sage', name: 'Sage', abilities: ['con', 'int', 'wis'], skills: ['arcanes', 'histoire'], feat: 'Initié à la magie (Magicien)', tool: 'Matériel de calligraphe', kitGold: 8, kit: [item('Bâton', 1, 2), item('Matériel de calligraphe', 1, 2.5), item("Livre d'histoire", 1, 2.5), item('Feuille de parchemin', 8), item('Robe', 1, 2)] },
  { featId: 'bagarreur', id: 'marin', name: 'Marin', abilities: ['str', 'dex', 'wis'], skills: ['acrobaties', 'perception'], feat: 'Bagarreur de taverne', tool: 'Outils de navigateur', kitGold: 20, kit: [item('Dague', 1, 0.5), item('Outils de navigateur', 1, 1), item('Corde', 1, 5), item('Tenue de voyage', 1, 2)] },
  { featId: 'doue', id: 'scribe', name: 'Scribe', abilities: ['dex', 'int', 'wis'], skills: ['investigation', 'perception'], feat: 'Doué', tool: 'Matériel de calligraphe', kitGold: 23, kit: [item('Matériel de calligraphe', 1, 2.5), item('Tenue raffinée', 1, 3), item('Lampe', 1, 0.5), item("Flasque d'huile", 3, 0.5), item('Feuille de parchemin', 12)] },
  { featId: 'sauvage', id: 'soldat', name: 'Soldat', abilities: ['str', 'dex', 'con'], skills: ['athletisme', 'intimidation'], feat: 'Attaquant sauvage', toolChoice: 'gaming', kitGold: 14, kit: [item('Lance', 1, 1.5), item('Arc court', 1, 1), item('Flèche', 20), item('Jeu choisi'), item('Trousse de soins', 1, 1.5), item('Carquois', 1, 0.5), item('Tenue de voyage', 1, 2)] },
  { featId: 'chanceux', id: 'vagabond', name: 'Vagabond', abilities: ['dex', 'wis', 'cha'], skills: ['intuition', 'discretion'], feat: 'Chanceux', tool: 'Outils de voleur', kitGold: 16, kit: [item('Dague', 2, 0.5), item('Outils de voleur', 1, 0.5), item('Jeu au choix'), item('Sac de couchage', 1, 3.5), item('Sacoche', 2, 0.5), item('Tenue de voyage', 1, 2)] },
];

export const backgroundById = (id: string | null | undefined): BackgroundDef | undefined =>
  BACKGROUNDS.find((background) => background.id === id);
