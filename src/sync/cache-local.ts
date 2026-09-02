import type { SyncRow } from './supabase-transport';
import type { Appartenance } from './membership';

/**
 * La dernière chose vue, gardée sur le téléphone.
 *
 * Sans ça, l'application ne s'ouvre pas sans réseau : le programme de fond
 * sait servir les fichiers hors ligne, mais il sert alors une coquille vide —
 * pas de table, pas de fiche, rien à lire. Une cave sans 4G, un wifi qui
 * tombe, et la séance s'arrête.
 *
 * Trois principes :
 *
 * 1. **Le cache ne fait jamais autorité.** Il est écrasé en bloc dès qu'une
 *    lecture réseau aboutit (`VersionedStore.applySnapshot`), et les versions
 *    portées par les lignes tranchent de toute façon en faveur du serveur. Il
 *    ne peut donc pas faire régresser un état frais.
 * 2. **Une panne de cache n'est jamais une panne d'application.** Quota plein,
 *    mode privé, stockage désactivé : tout est rattrapé, et au pire on
 *    retombe sur le comportement d'avant — il faut du réseau.
 * 3. **Se déconnecter efface tout.** Les fiches d'une table restent lisibles
 *    sur le téléphone tant qu'on y est connecté ; pas une seconde après.
 */

/**
 * Version du format. Une lecture qui ne la reconnaît pas est jetée plutôt que
 * devinée : mieux vaut repartir du réseau que déplier une forme qui a changé.
 */
const FORMAT = 1;

const PREFIXE = 'jg.cache.';
const clefCampagne = (campaignId: string) => `${PREFIXE}campagne.${campaignId}`;
const clefAppartenances = (userId: string) => `${PREFIXE}tables.${userId}`;

/**
 * Le strict nécessaire pour jouer : qui sont les personnages, et quel combat
 * est en cours. Si la place manque, c'est ce qu'on garde en sacrifiant le
 * reste — un journal illisible est ennuyeux, une fiche illisible arrête la
 * partie.
 */
export const TABLES_ESSENTIELLES = ['jg_sheets', 'jg_encounters'];

/** Ce que le navigateur nous prête. Injecté pour que les tests s'en passent. */
export interface StockageLocal {
  lire(clef: string): string | null;
  ecrire(clef: string, valeur: string): void;
  effacer(clef: string): void;
  clefs(): string[];
}

export interface CampagneEnCache {
  /** Quand ces données ont été enregistrées — affiché tel quel à l'écran. */
  enregistreLe: number;
  tables: Record<string, SyncRow[]>;
  /** Vrai si des tables ont été sacrifiées faute de place. */
  partiel: boolean;
}

/** Adapte `window.localStorage`, ou rien du tout s'il est indisponible. */
export function stockageDuNavigateur(): StockageLocal | null {
  try {
    const brut = window.localStorage;
    // Une simple lecture ne suffit pas à savoir s'il est utilisable : en mode
    // privé, certains navigateurs laissent lire et refusent d'écrire.
    const sonde = `${PREFIXE}sonde`;
    brut.setItem(sonde, '1');
    brut.removeItem(sonde);
    return {
      lire: (clef) => brut.getItem(clef),
      ecrire: (clef, valeur) => brut.setItem(clef, valeur),
      effacer: (clef) => brut.removeItem(clef),
      clefs: () => Object.keys(brut),
    };
  } catch {
    return null;
  }
}

/** Écrit, et dit si ça a tenu. Ne lève jamais : le cache est un confort. */
function tenter(stockage: StockageLocal, clef: string, valeur: string): boolean {
  try {
    stockage.ecrire(clef, valeur);
    return true;
  } catch {
    return false;
  }
}

function relire<T>(stockage: StockageLocal, clef: string): T | null {
  try {
    const brut = stockage.lire(clef);
    if (!brut) return null;
    const objet = JSON.parse(brut) as { format?: number } & T;
    if (objet?.format !== FORMAT) return null;
    return objet;
  } catch {
    // JSON tronqué par un onglet tué en pleine écriture, forme inattendue :
    // dans tous les cas on repart du réseau plutôt que de deviner.
    return null;
  }
}

export function lireCampagne(stockage: StockageLocal, campaignId: string): CampagneEnCache | null {
  const objet = relire<CampagneEnCache>(stockage, clefCampagne(campaignId));
  if (!objet || typeof objet.enregistreLe !== 'number' || !objet.tables) return null;
  return { enregistreLe: objet.enregistreLe, tables: objet.tables, partiel: Boolean(objet.partiel) };
}

/**
 * Enregistre l'état de la campagne. En cas de quota dépassé, réessaie avec les
 * seules tables essentielles plutôt que de tout perdre — puis abandonne
 * proprement, en effaçant l'entrée pour ne pas laisser une moitié de vérité.
 */
export function ecrireCampagne(
  stockage: StockageLocal,
  campaignId: string,
  tables: Record<string, SyncRow[]>,
  maintenant: number,
): 'complet' | 'partiel' | 'echec' {
  const clef = clefCampagne(campaignId);

  if (tenter(stockage, clef, JSON.stringify({ format: FORMAT, enregistreLe: maintenant, tables, partiel: false }))) {
    return 'complet';
  }

  const essentielles: Record<string, SyncRow[]> = {};
  for (const nom of TABLES_ESSENTIELLES) {
    if (tables[nom]) essentielles[nom] = tables[nom];
  }
  // La tentative complète vient d'échouer : l'ancienne entrée occupe encore la
  // place qu'on cherche. L'effacer d'abord donne sa chance à la repli.
  try { stockage.effacer(clef); } catch { /* rien à faire de plus */ }
  if (tenter(stockage, clef, JSON.stringify({ format: FORMAT, enregistreLe: maintenant, tables: essentielles, partiel: true }))) {
    return 'partiel';
  }

  try { stockage.effacer(clef); } catch { /* rien à faire de plus */ }
  return 'echec';
}

export function lireAppartenances(stockage: StockageLocal, userId: string): Appartenance[] | null {
  const objet = relire<{ appartenances?: Appartenance[] }>(stockage, clefAppartenances(userId));
  return Array.isArray(objet?.appartenances) ? objet.appartenances : null;
}

export function ecrireAppartenances(
  stockage: StockageLocal,
  userId: string,
  appartenances: Appartenance[],
): void {
  tenter(stockage, clefAppartenances(userId), JSON.stringify({ format: FORMAT, appartenances }));
}

/**
 * Efface tout ce que ce module a posé. Appelé à la déconnexion : le téléphone
 * qui change de main ne doit rien garder de la table qu'il quitte.
 */
export function oublierTout(stockage: StockageLocal): void {
  try {
    for (const clef of stockage.clefs()) {
      if (clef.startsWith(PREFIXE)) stockage.effacer(clef);
    }
  } catch {
    // Un stockage devenu inaccessible n'a plus rien à nous rendre.
  }
}

/** Ce que `CampaignSync` attend d'un cache, sans savoir où il est rangé. */
export interface CacheDeCampagne {
  lire(): CampagneEnCache | null;
  ecrire(tables: Record<string, SyncRow[]>, maintenant: number): void;
}

export function cacheDeCampagne(stockage: StockageLocal, campaignId: string): CacheDeCampagne {
  return {
    lire: () => lireCampagne(stockage, campaignId),
    ecrire: (tables, maintenant) => { ecrireCampagne(stockage, campaignId, tables, maintenant); },
  };
}
