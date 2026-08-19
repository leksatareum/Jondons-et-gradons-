/**
 * Lance occulte — filtrage des sorts mineurs candidats (audit PHB 2024, §19).
 *
 * L'invocation allonge la portée d'un sort mineur de dégâts. Un sort à portée
 * Personnelle, au Contact, ou dont la portée est inférieure à 3 m n'a pas de
 * portée à allonger : ce ne sont pas des candidats, et le repli silencieux sur
 * la liste complète des sorts mineurs de dégâts les proposait quand même.
 *
 * Attention aux portées « Personnelle (émanation de 1,50 m) » : le nombre qui
 * s'y trouve décrit la zone, pas une portée. Elles restent exclues.
 */

export const PORTEE_MINIMALE_METRES = 3;

/**
 * Portée en mètres, ou null quand l'entrée n'exprime pas une portée à distance
 * (Personnelle, Contact, portée non chiffrée comme « Portée de vue »).
 */
export function porteeEnMetres(portee: unknown): number | null {
  const texte = String(portee ?? '').trim();
  if (!texte) return null;
  if (/^(personnelle|self)\b/i.test(texte)) return null;
  if (/^(contact|touch)\b/i.test(texte)) return null;

  const kilometres = texte.match(/([\d\s.,]+)\s*km\b/i);
  if (kilometres) return nombreFrancais(kilometres[1]) * 1000;

  const metres = texte.match(/([\d\s.,]+)\s*m\b/i);
  if (metres) return nombreFrancais(metres[1]);

  return null;
}

/** « 1,50 » et « 1 500 » : virgule décimale, espace comme séparateur de milliers. */
function nombreFrancais(brut: string): number {
  const valeur = Number(brut.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(valeur) ? valeur : NaN;
}

export function estCandidatLanceOcculte(sort: { r?: unknown }): boolean {
  const portee = porteeEnMetres(sort?.r);
  return portee !== null && Number.isFinite(portee) && portee >= PORTEE_MINIMALE_METRES;
}

/**
 * Les sorts mineurs de dégâts réellement éligibles à Lance occulte : connus de
 * l'Occultiste, infligeant des dégâts, et dotés d'une portée d'au moins 3 m.
 */
export function rangedDamageCantripsFrom<T extends { id: string; name: string; range?: unknown }>(
  damageCantrips: T[],
): T[] {
  return damageCantrips.filter((cantrip) => estCandidatLanceOcculte({ r: cantrip.range }));
}
