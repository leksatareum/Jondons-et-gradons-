import { DAMAGE_TYPES } from '../content/reference-lists';

/**
 * Le type de dégâts d'un sort, lu dans son texte imprimé.
 *
 * Le catalogue (`content/spells.js`) ne porte AUCUN champ structuré pour les
 * dégâts d'un sort — voir l'en-tête de `spell-cards.ts` — et cette règle ne
 * change pas ici : un NOMBRE de dégâts reste hors de portée, une extraction
 * de texte lui donnerait l'aplomb d'une valeur juste alors qu'elle serait
 * fausse.
 *
 * Le TYPE de dégâts est une autre affaire : treize valeurs connues
 * d'avance (`DAMAGE_TYPES`), jamais un chiffre. Se tromper de badge sur une
 * carte n'égare personne au moment de résoudre une attaque — ça n'affiche
 * qu'un petit repère visuel — donc le risque à accepter n'est pas le même
 * que pour un nombre. Reste la même prudence : mieux vaut n'afficher AUCUN
 * badge que d'en afficher un faux. La phrase « dégâts (de/d') TYPE » est
 * quasi systématique dans le texte français du jeu ; les seuls faux
 * positifs trouvés en testant sur les 389 sorts du catalogue venaient de
 * phrases défensives (immunité, résistance, vulnérabilité, sensibilité) —
 * elles sont explicitement exclues ci-dessous.
 */

const TYPE_ALTERNATION = DAMAGE_TYPES.join('|');

// Négations en tête : « immunisé(e)(s) aux dégâts de poison », « résistes
// aux dégâts radiants »… décrivent une protection, jamais des dégâts
// INFLIGÉS par le sort. `[^\s]*` plutôt que `\w*` : `\w` ignore les lettres
// accentuées (é, è…), et ces radicaux en portent presque toujours une
// (immunisé, résistant…) — un `\w*` les aurait laissées passer.
const DAMAGE_TYPE_RE = new RegExp(
  `(?<!résist[^\\s]* aux )(?<!imm[^\\s]* aux )(?<!vuln[ée]rabl[^\\s]* aux )(?<!sensibl[^\\s]* aux )`
  + `dégâts\\s+(?:de\\s+|d['’])?(${TYPE_ALTERNATION})`,
  'gi',
);

/**
 * Un, plusieurs, ou aucun type de dégâts — dans l'ordre où le texte les cite.
 * Plusieurs types n'a rien d'anormal : Colonne de flamme inflige à la fois
 * des dégâts de feu ET des dégâts radiants, dans la même phrase.
 */
export function damageTypesOf(spell: { text: string; upcast?: string }): string[] {
  const texte = `${spell.text} ${spell.upcast ?? ''}`;
  const trouves: string[] = [];
  DAMAGE_TYPE_RE.lastIndex = 0;
  let correspondance: RegExpExecArray | null;
  while ((correspondance = DAMAGE_TYPE_RE.exec(texte))) {
    const type = correspondance[1].toLocaleLowerCase('fr');
    if (!trouves.includes(type)) trouves.push(type);
  }
  return trouves;
}
