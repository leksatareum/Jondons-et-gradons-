/**
 * Styles de combat — PHB 2024. En 2024, le Style de combat est un don, pas
 * une capacité de classe : n'importe quel personnage qui y a accès en
 * choisit un parmi ces dix options. Repêché de `table-connectee/src/App.jsx`
 * (`FIGHTING_STYLES`) — liste standard, vérifiée (dix options, inchangées
 * depuis la sortie du PHB 2024).
 */
export interface FightingStyleOption {
  id: string;
  name: string;
  desc: string;
}

export const FIGHTING_STYLES: FightingStyleOption[] = [
  { id: 'archerie', name: 'Archerie', desc: "+2 aux jets d'attaque avec les armes à distance." },
  { id: 'aveugle', name: 'Combat en aveugle', desc: 'Perception aveugle sur 3 mètres.' },
  { id: 'defense', name: 'Défense', desc: "+1 à la classe d'armure tant que tu portes une armure." },
  { id: 'duel', name: 'Duel', desc: "+2 aux dégâts avec une arme de corps à corps à une main, sans autre arme." },
  { id: 'grandes', name: 'Armes à deux mains', desc: "Sur les dégâts d'une arme de mêlée tenue à deux mains, chaque 1 ou 2 du dé est traité comme un 3." },
  { id: 'interception', name: 'Interception', desc: "Avec un bouclier ou une arme en main, ta réaction réduit de 1d10 + bonus de maîtrise les dégâts d'un allié à 1,50 m." },
  { id: 'protection', name: 'Protection', desc: "Bouclier requis : ta réaction impose un désavantage à une attaque visant un allié à 1,50 m." },
  { id: 'lancer', name: 'Armes de jet', desc: '+2 aux dégâts avec les armes de jet.' },
  { id: 'deuxarmes', name: 'Combat à deux armes', desc: "Tu ajoutes ton modificateur aux dégâts de l'attaque secondaire." },
  { id: 'mainsnues', name: 'Combat à mains nues', desc: "Tes coups infligent 1d6 + FOR, ou 1d8 sans arme ni bouclier ; au début de ton tour, une cible agrippée subit 1d4." },
];

/**
 * Guerrier druidique — alternative propre au Rôdeur : à la place d'un don
 * de Style de combat, apprend deux sorts mineurs de Druide (utilisant la
 * Sagesse, comptant comme sorts de Rôdeur), remplaçables à chaque niveau de
 * Rôdeur. Réservée au Rôdeur — les autres classes qui piochent dans
 * `FIGHTING_STYLES` (Guerrier, Paladin, Barbare selon leurs dons/capacités)
 * n'y ont pas droit, d'où une option à part plutôt qu'ajoutée à la liste
 * commune.
 */
export const DRUIDIC_WARRIOR: FightingStyleOption = {
  id: 'guerrier-druidique',
  name: 'Guerrier druidique',
  desc: "À la place d'un don de style de combat : tu apprends deux sorts mineurs de Druide, qui comptent comme des sorts de Rôdeur pour toi et utilisent la Sagesse. À chaque niveau de Rôdeur, tu peux en remplacer un par un autre sort mineur de Druide.",
};

export const RANGER_FIGHTING_STYLES: FightingStyleOption[] = [...FIGHTING_STYLES, DRUIDIC_WARRIOR];
