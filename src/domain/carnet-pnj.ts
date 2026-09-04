import { APPARENCES, SECRETS, STYLES_DE_NOM } from '../content/pnj';
import type { StockageLocal } from '../sync/cache-local';

/**
 * Le carnet de PNJ du Maître — tirage, et suivi de la loyauté.
 *
 * ═══ Pourquoi il vit sur le téléphone, et pas en base ═══
 *
 * Tout le reste de l'appli se synchronise : les fiches, la rencontre, le
 * journal. Ce carnet, non — et c'est un choix, pas un raccourci.
 *
 * Le Guide est formel sur la loyauté (p. 89) : les joueurs ne doivent pas
 * savoir où en est le score. Une table partagée est le mauvais endroit pour
 * un nombre qui doit rester caché : il suffit d'une règle d'accès mal posée,
 * un jour, pour que la trahison du guide se lise sur le téléphone d'un
 * joueur. Le carnet reste donc là où le MJ le tient — sur son appareil.
 *
 * La contrepartie est réelle et doit être dite à l'écran : changer de
 * téléphone perd le carnet.
 */

export type PnjDuCarnet = {
  id: string;
  /** Ce que le MJ tape par-dessus le tirage. Vide tant qu'il n'a pas nommé. */
  nom: string;
  /** Le style de nom tiré — une piste de sonorité, pas un nom. */
  style: string;
  apparence: string;
  secret: string;
  /** Où en est sa loyauté. Borné par le maximum du groupe à chaque mouvement. */
  loyaute: number;
};

/** Un tirage complet, sans rien enregistrer. `hasard` rend un flottant dans [0,1[. */
export function tirerPnj(hasard: () => number, loyauteDeDepart: number): Omit<PnjDuCarnet, 'id'> {
  const dans = <T,>(table: T[]): T => table[Math.floor(hasard() * table.length)]!;
  return {
    nom: '',
    style: dans(STYLES_DE_NOM).nom,
    apparence: dans(APPARENCES),
    secret: dans(SECRETS),
    loyaute: loyauteDeDepart,
  };
}

/**
 * Déplace la loyauté sans jamais sortir des bornes du Guide : pas au-dessus du
 * maximum du groupe, pas en dessous de zéro.
 */
export const deplacerLoyaute = (courante: number, delta: number, maximum: number): number =>
  Math.max(0, Math.min(maximum, courante + delta));

const clef = (campaignId: string) => `jg.pnj.${campaignId}`;
const FORMAT = 1;

export function lireCarnet(stockage: StockageLocal, campaignId: string): PnjDuCarnet[] {
  try {
    const brut = stockage.lire(clef(campaignId));
    if (!brut) return [];
    const objet = JSON.parse(brut) as { format?: number; pnj?: PnjDuCarnet[] };
    if (objet?.format !== FORMAT || !Array.isArray(objet.pnj)) return [];
    // Une entrée sans identifiant ne pourrait plus être ni modifiée ni
    // supprimée : elle resterait à l'écran pour toujours.
    return objet.pnj.filter((entree) => entree && typeof entree.id === 'string');
  } catch {
    return [];
  }
}

/** N'échoue jamais : un carnet qu'on n'arrive pas à écrire ne doit pas arrêter la séance. */
export function ecrireCarnet(stockage: StockageLocal, campaignId: string, pnj: PnjDuCarnet[]): void {
  try {
    stockage.ecrire(clef(campaignId), JSON.stringify({ format: FORMAT, pnj }));
  } catch {
    /* Quota plein, mode privé : le carnet vaut moins que la partie. */
  }
}
