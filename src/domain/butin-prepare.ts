import { catalogueADonner, type ObjetADonner } from './don-d-objet';

/**
 * Le butin attaché à une rencontre préparée.
 *
 * ═══ Pourquoi il vit sur la rencontre, et pas ailleurs ═══
 *
 * Composer un butin en pleine séance, c'est chercher dans 356 objets pendant
 * que trois joueurs attendent. Or le butin se décide au même moment que la
 * rencontre — on sait ce que garde le chef gobelin quand on décide qu'il y a
 * un chef gobelin. Le préparer avec elle est donc le geste naturel ; le
 * distribuer d'un appui, une fois le combat fini, est ce qui reste à faire.
 *
 * ═══ Ce qu'on enregistre, et ce qu'on ne enregistre pas ═══
 *
 * Une ligne de butin garde le NOM et l'identifiant de sac, pas l'objet du
 * catalogue. Deux raisons : la ligne doit survivre à une réécriture du
 * catalogue — une rencontre préparée il y a trois mois ne doit pas se vider
 * parce qu'un identifiant a changé — et le MJ peut vouloir y mettre quelque
 * chose que le livre ne connaît pas (« la clé de la cave »).
 *
 * `clef` sert seulement à retrouver la fiche du catalogue pour l'afficher.
 * Elle peut ne plus correspondre à rien : la ligne reste donnable.
 */

export type LigneDeButin = {
  /** Identifiant propre à la ligne — deux fois le même objet, c'est deux lignes. */
  id: string;
  /** La clef du catalogue réuni (`mag:…`, `eq:…`), quand l'objet en vient. */
  clef?: string;
  nom: string;
  qty: number;
  /** Ce qui part dans le sac, pour qu'un consommable y arrive vivant. */
  catalogId?: string;
};

export type ButinPrepare = {
  objets: LigneDeButin[];
  /** Les pièces d'or de la cachette. Partagées, jamais imposées : voir `partDeChacun`. */
  or: number;
};

export const BUTIN_VIDE: ButinPrepare = { objets: [], or: 0 };

const nouvelId = (): string => `but-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Lit ce que la base rend, en refusant tout ce qui n'est pas exploitable. */
export function lireButin(brut: unknown): ButinPrepare {
  if (!brut || typeof brut !== 'object') return BUTIN_VIDE;
  const objet = brut as { objets?: unknown; or?: unknown };
  const objets = Array.isArray(objet.objets)
    ? objet.objets
      .filter((ligne): ligne is LigneDeButin =>
        Boolean(ligne) && typeof ligne === 'object'
        && typeof (ligne as LigneDeButin).nom === 'string'
        && (ligne as LigneDeButin).nom.trim() !== '')
      // Une ligne sans identifiant ne pourrait plus être ni modifiée ni
      // retirée : on lui en donne un plutôt que de la jeter.
      .map((ligne) => ({ ...ligne, id: ligne.id || nouvelId(), qty: Math.max(1, Math.floor(ligne.qty || 1)) }))
    : [];
  const or = typeof objet.or === 'number' && Number.isFinite(objet.or) ? Math.max(0, Math.floor(objet.or)) : 0;
  return { objets, or };
}

export const butinEstVide = (butin: ButinPrepare): boolean =>
  butin.objets.length === 0 && butin.or === 0;

/** Ajoute un objet du catalogue au butin, ou augmente la ligne s'il y est déjà. */
export function ajouterAuButin(butin: ButinPrepare, objet: ObjetADonner, quantite = 1): ButinPrepare {
  const qty = Math.max(1, Math.floor(quantite));
  const existante = butin.objets.find((ligne) => ligne.clef === objet.clef);
  if (existante) {
    return {
      ...butin,
      objets: butin.objets.map((ligne) =>
        (ligne.id === existante.id ? { ...ligne, qty: ligne.qty + qty } : ligne)),
    };
  }
  return {
    ...butin,
    objets: [...butin.objets, {
      id: nouvelId(),
      clef: objet.clef,
      nom: objet.nom,
      qty,
      ...(objet.catalogId ? { catalogId: objet.catalogId } : {}),
    }],
  };
}

/** Une ligne écrite à la main — ce que le livre ne connaît pas. */
export function ajouterLigneLibre(butin: ButinPrepare, nom: string, quantite = 1): ButinPrepare {
  const propre = nom.trim();
  if (!propre) return butin;
  return {
    ...butin,
    objets: [...butin.objets, { id: nouvelId(), nom: propre, qty: Math.max(1, Math.floor(quantite)) }],
  };
}

export function changerQuantite(butin: ButinPrepare, ligneId: string, qty: number): ButinPrepare {
  if (qty <= 0) return retirerDuButin(butin, ligneId);
  return {
    ...butin,
    objets: butin.objets.map((ligne) => (ligne.id === ligneId ? { ...ligne, qty: Math.floor(qty) } : ligne)),
  };
}

export const retirerDuButin = (butin: ButinPrepare, ligneId: string): ButinPrepare => ({
  ...butin,
  objets: butin.objets.filter((ligne) => ligne.id !== ligneId),
});

export const changerOr = (butin: ButinPrepare, or: number): ButinPrepare => ({
  ...butin,
  or: Math.max(0, Math.floor(Number.isFinite(or) ? or : 0)),
});

/** La fiche du catalogue, pour afficher l'effet d'un objet magique. Absente pour une ligne libre. */
export const ficheDeLaLigne = (ligne: LigneDeButin): ObjetADonner | undefined =>
  (ligne.clef ? catalogueADonner().find((entree) => entree.clef === ligne.clef) : undefined);

/**
 * Le partage de l'or, à la façon dont une table le fait vraiment : chacun sa
 * part, et le reste au premier. Rendre une division à virgule obligerait le MJ
 * à trancher lui-même une pièce en trois.
 */
export function partDeChacun(or: number, nombre: number): { part: number; reste: number } {
  if (nombre <= 0) return { part: 0, reste: Math.max(0, Math.floor(or)) };
  const total = Math.max(0, Math.floor(or));
  return { part: Math.floor(total / nombre), reste: total % nombre };
}

/** Ce qui part dans un sac, pour chaque ligne. */
export const lignesDeSac = (butin: ButinPrepare): { name: string; qty: number; catalogId?: string }[] =>
  butin.objets.map((ligne) => ({
    name: ligne.nom,
    qty: ligne.qty,
    ...(ligne.catalogId ? { catalogId: ligne.catalogId } : {}),
  }));
