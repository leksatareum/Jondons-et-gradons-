/**
 * Mettre deux noms d'objet sous la même forme pour les comparer.
 *
 * Le sac est en texte libre : un joueur tape « potion de soin », « Potion de
 * Soins », « Bâton de combat (focaliseur druidique) ». Tout ce qui suit sert
 * à ce que ces trois-là retrouvent quand même leur entrée au catalogue.
 *
 * Extrait de `weapon-ownership.ts` et `consumable-ownership.ts`, qui en
 * avaient chacun leur copie — et pas la MÊME : seule celle des armes coupait
 * la parenthèse finale. C'est pour ça que l'option existe plutôt qu'un
 * comportement unique : les deux appelants ont chacun leurs tests, et aligner
 * l'un sur l'autre en douce aurait changé ce qu'ils reconnaissent.
 */
export function normaliserNom(
  nom: string,
  options: { sansParenthese?: boolean } = {},
): string {
  const base = nom
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents : marques diacritiques isolées par NFD
    .replace(/[‘’]/g, "'"); // apostrophes courbes alignées sur l'apostrophe droite
  const coupe = options.sansParenthese
    // « Bâton de combat (focaliseur druidique) » → « Bâton de combat »
    ? base.replace(/\s*\([^)]*\)\s*$/, '')
    : base;
  return coupe.trim().toLocaleLowerCase('fr');
}

/**
 * Forme TOLÉRANTE, essayée seulement quand la forme exacte n'a rien trouvé.
 *
 * Écrite contre des sacs réels, pas contre des cas imaginés. Dans la campagne
 * en cours, trois objets bien présents ne servaient à rien faute d'un « s » ou
 * d'un mot de contenant :
 *
 * · « Potion de soin » — au singulier — n'était pas la « Potion de soins » du
 *   catalogue. Une potion inerte dans le sac, sans jet de dés ni raccourci,
 *   pendant que les deux autres joueurs avaient la leur.
 * · « Flasque d'huile » n'était pas « Huile ». Trois flasques sans usage.
 * · Une « Fiole d'acide » aurait subi le même sort.
 *
 * Deux transformations, toutes deux réversibles de tête — c'est le critère :
 * on doit pouvoir expliquer un rapprochement à la table en une phrase.
 *
 * 1. Le pluriel français se replie sur le singulier (« soins » → « soin »).
 * 2. Un contenant explicite en tête tombe (« flasque d'huile » → « huile »),
 *    mais SEULEMENT devant « de/d' » : « Flasque en argent avec symbole »,
 *    qui est un objet de quête et non un contenant d'autre chose, reste
 *    intacte.
 *
 * Ce qui ne s'explique pas ainsi n'a rien à faire ici : les vrais synonymes
 * (« Bâton » pour « Bâton de combat ») vivent dans une table nommée, pas dans
 * une astuce d'orthographe.
 */
const CONTENANTS = /^(?:flasque|fiole|pot|bouteille|flacon)\s+(?:de\s+|d')/;

export function formeTolerante(nom: string, options: { sansParenthese?: boolean } = {}): string {
  const base = normaliserNom(nom, options).replace(CONTENANTS, '');
  return base
    .split(/\s+/)
    // Un mot de deux lettres ou moins n'a pas de pluriel à retirer : « as »,
    // « os », « du » perdraient leur sens.
    .map((mot) => (mot.length > 2 ? mot.replace(/[sx]$/, '') : mot))
    .join(' ')
    .trim();
}
