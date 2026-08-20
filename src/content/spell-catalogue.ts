import { SPELLS } from './spells.js';
import { SPELL_LIST_CODE } from './reference-lists';

/**
 * Accès typé au catalogue de sorts.
 *
 * `spells.js` stocke chaque sort sous des clés courtes (`n`, `lv`, `sc`, `t`…)
 * héritées de `table-connectee`, où elles étaient lues à la main dans un
 * composant de 12 000 lignes. Les renommer dans le fichier de données
 * obligerait à rejouer la comparaison des 391 entrées avec la source ; les
 * renommer ici ne coûte rien et évite que le reste du code apprenne un
 * vocabulaire qu'il n'a pas de raison de connaître.
 */

export interface Spell {
  id: string;
  name: string;
  /** 0 pour un sort mineur. */
  level: number;
  school: string;
  /** Temps d'incantation, tel qu'écrit : « Action », « Action bonus », « Réaction »… */
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  /** Codes des listes de classes qui donnent accès au sort. */
  classes: string[];
  text: string;
  /** Effet aux rangs supérieurs, quand le sort en a un. */
  upcast?: string;
}

interface RawSpell {
  id?: string; n?: string; lv?: number; sc?: string; t?: string; r?: string;
  cp?: string; du?: string; cl?: string[]; d?: string; up?: string;
}

const read = (raw: RawSpell): Spell => ({
  id: String(raw.id ?? ''),
  name: String(raw.n ?? ''),
  level: Number(raw.lv ?? 0),
  school: String(raw.sc ?? ''),
  castingTime: String(raw.t ?? ''),
  range: String(raw.r ?? ''),
  components: String(raw.cp ?? ''),
  duration: String(raw.du ?? ''),
  classes: [...(raw.cl ?? [])],
  text: String(raw.d ?? ''),
  ...(raw.up ? { upcast: String(raw.up) } : {}),
});

export const CATALOGUE: Spell[] = (SPELLS as RawSpell[]).map(read);

const BY_ID = new Map(CATALOGUE.map((spell) => [spell.id, spell]));

export const spellById = (id: string | null | undefined): Spell | null =>
  (id ? BY_ID.get(id) ?? null : null);

/**
 * Les sorts d'une liste de classe.
 *
 * Une classe inconnue renvoie une liste vide plutôt que le catalogue entier :
 * proposer 391 sorts à un roublard serait pire qu'un écran vide, parce que
 * l'erreur ne se verrait pas.
 */
export function spellsForClass(classId: string, level?: number): Spell[] {
  const code = SPELL_LIST_CODE[classId];
  if (!code) return [];
  return CATALOGUE.filter((spell) =>
    spell.classes.includes(code) && (level === undefined || spell.level === level));
}

const sansAccents = (texte: string): string =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');

/**
 * Recherche un sort par son nom, du plus pertinent au moins.
 *
 * L'ordre compte plus qu'il n'y paraît. « Boule de feu » et « Boule de feu à
 * retardement » commencent pareil, et le catalogue range le second en premier :
 * qui tape « boule de feu » et prend le premier résultat accorde un autre sort
 * que celui qu'il visait, sans que rien ne le signale. Un nom exact passe donc
 * devant, puis les débuts de nom, puis le reste.
 */
export function searchSpells(query: string, limit = 40): Spell[] {
  const q = sansAccents(query.trim());
  if (q.length < 2) return [];
  const rang = (spell: Spell): number => {
    const nom = sansAccents(spell.name);
    if (nom === q) return 0;
    if (nom.startsWith(q)) return 1;
    if (nom.includes(q)) return 2;
    return 3;
  };
  return CATALOGUE
    .map((spell) => ({ spell, rang: rang(spell) }))
    .filter((entry) => entry.rang < 3)
    .sort((a, b) => a.rang - b.rang
      || a.spell.name.localeCompare(b.spell.name, 'fr'))
    .slice(0, limit)
    .map((entry) => entry.spell);
}
