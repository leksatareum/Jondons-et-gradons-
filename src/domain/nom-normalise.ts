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
