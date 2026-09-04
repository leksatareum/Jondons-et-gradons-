import { EQUIPMENT_CATALOG } from '../content/equipment';
import { WEAPONS, WEAPON_PRICES } from '../content/weapons';
import { ARMORS, ARMOR_PRICES, SHIELD } from '../content/armor';
import { LIBELLE_CATEGORIE, LIBELLE_RARETE, OBJETS_MAGIQUES } from '../content/objets-magiques';
import { resolveActionableItem } from './consumable-ownership';

/**
 * Ce que le MJ peut glisser dans le sac d'un joueur.
 *
 * ═══ Un seul catalogue, quatre sources ═══
 *
 * Le butin d'une séance ne sort pas d'un seul endroit : une potion et un
 * parchemin viennent de l'équipement, une épée des armes, une cotte des
 * armures, un Sac sans fond du chapitre des trésors. Le MJ, lui, ne veut pas
 * savoir dans quel fichier ça vit — il tape « potion » et il donne.
 *
 * ═══ Le piège du doublon inerte ═══
 *
 * La Potion de soins existe DEUX fois : dans le catalogue d'équipement, où
 * elle est buvable (2d4 + 2, action bonus), et dans le chapitre des objets
 * magiques, où elle n'est qu'un texte de référence. Donner la seconde
 * poserait dans le sac du joueur une potion qu'il ne pourrait pas boire.
 *
 * D'où `catalogIdPourLeSac` : avant d'écrire, on redemande au catalogue
 * d'équipement s'il connaît cet objet par son nom. S'il le connaît, c'est SON
 * identifiant qui part dans le sac, et la potion arrive fonctionnelle.
 */

export type Provenance = 'magique' | 'equipement' | 'arme' | 'armure';

export const LIBELLE_PROVENANCE: Record<Provenance, string> = {
  magique: 'Objet magique',
  equipement: 'Équipement',
  arme: 'Arme',
  armure: 'Armure',
};

export type ObjetADonner = {
  /** Unique dans tout le catalogue réuni — deux sources peuvent partager un nom. */
  clef: string;
  nom: string;
  provenance: Provenance;
  /** Une ligne de contexte : rareté, ou prix et poids. */
  detail: string;
  /** Ce qui part dans le sac. Voir `catalogIdPourLeSac`. */
  catalogId?: string;
  /** Le texte complet, quand il y en a un — l'effet d'un objet magique. */
  texte?: string;
};

/**
 * L'identifiant à écrire dans le sac, pour que l'objet y arrive VIVANT.
 *
 * La reconnaissance des consommables se fait d'abord sur le nom (voir
 * `consumable-ownership.ts`), donc un nom juste suffirait. Mais poser le bon
 * identifiant rend la ligne robuste au jour où le joueur la renomme
 * — « Potion de soins » devenue « la fiole de Maître Ilbert ».
 */
export function catalogIdPourLeSac(nom: string, secours?: string): string | undefined {
  return resolveActionableItem({ name: nom })?.id ?? secours;
}

const prix = (po: number | undefined): string =>
  (po === undefined ? '' : `${po} po`);

export function catalogueADonner(): ObjetADonner[] {
  const objets: ObjetADonner[] = [];

  for (const entree of EQUIPMENT_CATALOG) {
    // Un service ne se met pas dans un sac : on ne peut pas donner une nuit
    // d'auberge ni un trajet en carriole.
    if (entree.service) continue;
    objets.push({
      clef: `eq:${entree.id}`,
      nom: entree.name,
      provenance: 'equipement',
      detail: [prix(entree.price), entree.weight ? `${entree.weight} kg` : ''].filter(Boolean).join(' · '),
      catalogId: entree.id,
      texte: entree.desc,
    });
  }

  for (const arme of WEAPONS) {
    objets.push({
      clef: `arme:${arme.id}`,
      nom: arme.name,
      provenance: 'arme',
      detail: [arme.dmg, prix(WEAPON_PRICES[arme.id])].filter(Boolean).join(' · '),
      catalogId: catalogIdPourLeSac(arme.name, arme.id),
    });
  }

  for (const armure of ARMORS) {
    // « Sans armure » est un état de la fiche, pas un objet : le donner
    // poserait une ligne vide dans un sac.
    if (armure.id === 'none') continue;
    objets.push({
      clef: `armure:${armure.id}`,
      nom: armure.name,
      provenance: 'armure',
      detail: [prix(ARMOR_PRICES[armure.id]), `${armure.weight} kg`].filter(Boolean).join(' · '),
      catalogId: catalogIdPourLeSac(armure.name, armure.id),
    });
  }
  objets.push({
    clef: `armure:${SHIELD.id}`,
    nom: SHIELD.name,
    provenance: 'armure',
    detail: `${SHIELD.price} po · ${SHIELD.weight} kg`,
    catalogId: catalogIdPourLeSac(SHIELD.name, SHIELD.id),
  });

  for (const objet of OBJETS_MAGIQUES) {
    objets.push({
      clef: `mag:${objet.id}`,
      nom: objet.nom,
      provenance: 'magique',
      detail: `${LIBELLE_CATEGORIE[objet.categorie]} · ${LIBELLE_RARETE[objet.rarete]}`
        + (objet.harmonisation !== undefined ? ' · harmonisation' : ''),
      catalogId: catalogIdPourLeSac(objet.nom, objet.id),
      texte: objet.effet,
    });
  }

  return objets;
}

const sansAccent = (texte: string): string =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * La recherche du don. Les objets MAGIQUES passent devant à nom égal : quand
 * le MJ tape « potion de soins », il vient d'en choisir une dans le chapitre
 * des trésors, pas dans la liste des courses.
 */
export function chercherADonner(question: string, provenances?: Provenance[]): ObjetADonner[] {
  const cible = sansAccent(question.trim());
  const rang: Record<Provenance, number> = { magique: 0, equipement: 1, arme: 2, armure: 3 };
  return catalogueADonner()
    .filter((objet) => {
      if (cible && !sansAccent(objet.nom).includes(cible)) return false;
      if (provenances?.length && !provenances.includes(objet.provenance)) return false;
      return true;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr') || rang[a.provenance] - rang[b.provenance]);
}

/** Ce qui part réellement dans le sac, une fois le destinataire et la quantité choisis. */
export const ligneDeSac = (objet: ObjetADonner, quantite: number): { name: string; qty: number; catalogId?: string } => ({
  name: objet.nom,
  qty: Math.max(1, Math.floor(quantite)),
  ...(objet.catalogId ? { catalogId: objet.catalogId } : {}),
});
