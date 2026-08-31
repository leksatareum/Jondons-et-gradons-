import { EQUIPMENT_CATALOG, formatPriceGp, type EquipmentEntry } from '../content/equipment';
import { WEAPONS, weaponPriceGp, type WeaponDef } from '../content/weapons';
import { ARMORS, ARMOR_PRICES, type ArmorDef } from '../content/armor';
import { normaliserNom } from './nom-normalise';

/**
 * Chercher un objet dans les catalogues, pour le poser dans le sac.
 *
 * Le sac restait en texte libre de bout en bout : un joueur qui tapait
 * « potion de soin » obtenait bien une ligne dans son sac, mais PAS une
 * potion — ni raccourci de Combat, ni jet de soin automatique — parce que
 * rien ne la rattachait à l'entrée « Potion de soins » du catalogue (voir
 * `domain/consumable-ownership.ts`, qui reconnaît sur le nom exact). Le texte
 * libre reste indispensable pour les objets de quête, qui n'existent dans
 * aucun catalogue ; c'est le CHOIX entre les deux qui manquait.
 *
 * Les trois catalogues sont interrogés ensemble — équipement, armes,
 * armures : du point de vue du joueur, « ajouter une épée courte » et
 * « ajouter une corde » sont le même geste, et les séparer l'obligerait à
 * savoir d'avance dans quelle liste ranger ce qu'il cherche.
 */

export type EffetConnu = 'soin' | 'combat' | 'arme' | 'armure';

export interface ObjetTrouve {
  /** L'identifiant du catalogue — écrit sur la ligne du sac pour une reconnaissance exacte. */
  catalogId: string;
  nom: string;
  categorie: string;
  detail: string;
  prix: string;
  /**
   * Ce que l'appli saura faire de cet objet une fois au sac. Sert à le DIRE
   * au joueur au moment du choix : c'est toute la différence entre la potion
   * qui lancera ses dés toute seule et celle qu'on aura tapée à la main.
   */
  effet?: EffetConnu;
}

const effetEquipement = (entry: EquipmentEntry): EffetConnu | undefined =>
  (entry.healDice ? 'soin' : entry.actionSlot ? 'combat' : undefined);

const CATEGORIE_EQUIPEMENT: Record<EquipmentEntry['section'], string> = {
  outil: 'Outil', aventure: 'Aventure', monture: 'Monture',
  vehicule: 'Véhicule', service: 'Service',
};

const depuisEquipement = (entry: EquipmentEntry): ObjetTrouve => ({
  catalogId: entry.id,
  nom: entry.name,
  categorie: CATEGORIE_EQUIPEMENT[entry.section],
  detail: entry.desc,
  prix: formatPriceGp(entry.price),
  effet: effetEquipement(entry),
});

/** « 1d8 », « 2d6 », ou le montant fixe d'une arme qui n'en lance pas. */
const desDeLArme = (weapon: WeaponDef): string =>
  (weapon.fixed !== undefined ? String(weapon.fixed) : `${weapon.diceCount ?? 1}d${weapon.die}`);

const depuisArme = (weapon: WeaponDef): ObjetTrouve => ({
  catalogId: weapon.id,
  nom: weapon.name,
  categorie: 'Arme',
  detail: [`${desDeLArme(weapon)} ${weapon.dmg}`, weapon.props].filter(Boolean).join(' · '),
  prix: formatPriceGp(weaponPriceGp(weapon.id) ?? 0),
  effet: 'arme',
});

const depuisArmure = (armor: ArmorDef): ObjetTrouve => ({
  catalogId: armor.id,
  nom: armor.name,
  categorie: 'Armure',
  detail: [
    armor.cat,
    `CA ${armor.base}${armor.dexCap === null ? ' + Dex' : armor.dexCap > 0 ? ` + Dex (max ${armor.dexCap})` : ''}`,
    armor.str > 0 ? `FOR ${armor.str}` : '',
    armor.stealth ? 'Discrétion désavantagée' : '',
  ].filter(Boolean).join(' · '),
  prix: formatPriceGp(ARMOR_PRICES[armor.id] ?? 0),
  effet: 'armure',
});

/**
 * Tout ce qu'on peut poser dans un sac, à plat.
 *
 * Les services (une nuit d'auberge, un trajet en bateau) sont écartés : on
 * les paie, on ne les range pas — les proposer à l'ajout ferait des lignes
 * de sac qui n'ont aucun sens.
 */
const TOUT: ObjetTrouve[] = [
  ...EQUIPMENT_CATALOG.filter((entry) => entry.section !== 'service').map(depuisEquipement),
  ...WEAPONS.map(depuisArme),
  // « Sans armure » est un état, pas un objet : il n'a rien à faire dans un sac.
  ...ARMORS.filter((armor) => armor.id !== 'none').map(depuisArmure),
];

const INDEX = TOUT.map((objet) => ({ objet, cherchable: normaliserNom(objet.nom, { sansParenthese: true }) }));

/**
 * Le rang d'une correspondance : plus c'est petit, plus ça remonte.
 *
 * Un mot tapé en entier doit primer sur un mot simplement contenu — sans ça,
 * « corde » sort d'abord « Corde à boyau » ou « Cordonnier » plutôt que
 * « Corde (15 m) », et le joueur croit que son objet n'existe pas.
 */
const rang = (cherchable: string, requete: string): number | null => {
  if (cherchable === requete) return 0;
  if (cherchable.startsWith(requete)) return 1;
  // Tous les mots de la requête doivent être présents, dans n'importe quel
  // ordre : « soins potion » trouve « Potion de soins » comme « potion soin ».
  const mots = requete.split(/\s+/).filter(Boolean);
  if (mots.length === 0) return null;
  if (mots.every((mot) => cherchable.includes(mot))) return mots.length > 1 ? 2 : 3;
  return null;
};

/** Les objets du catalogue qui répondent à ce qu'on tape. Vide si la requête est vide. */
export function chercherObjets(requete: string, limite = 8): ObjetTrouve[] {
  const cherchee = normaliserNom(requete, { sansParenthese: true });
  if (cherchee.length === 0) return [];
  const trouves: { objet: ObjetTrouve; rang: number }[] = [];
  for (const entree of INDEX) {
    const note = rang(entree.cherchable, cherchee);
    if (note !== null) trouves.push({ objet: entree.objet, rang: note });
  }
  return trouves
    .sort((a, b) => a.rang - b.rang || a.objet.nom.localeCompare(b.objet.nom, 'fr'))
    .slice(0, limite)
    .map((entree) => entree.objet);
}

/** Quelques consommables courants, montrés avant que le joueur ait tapé quoi que ce soit. */
export const SUGGESTIONS_DEPART: ObjetTrouve[] = [
  'av-potion-soins', 'av-antitoxine', 'av-huile', 'av-poison', 'av-corde', 'av-torche',
]
  .map((id) => TOUT.find((objet) => objet.catalogId === id))
  .filter((objet): objet is ObjetTrouve => Boolean(objet));
