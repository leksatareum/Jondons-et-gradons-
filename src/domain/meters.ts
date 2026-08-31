/**
 * Distances en mètres, telles qu'écrites dans les textes de règle : « 9 m »,
 * « 1,50 m »… — virgule française, jamais de point. Extrait de
 * `druid-elemental-fury.ts`, qui en avait besoin le premier ; la vitesse
 * effective (`derive.ts`, pénalité d'Épuisement) en a besoin à son tour —
 * mieux vaut un seul endroit qui sache lire et écrire ce format que deux
 * copies qui divergent.
 */

export const parseMeters = (valeur: string | undefined): number | null => {
  const correspondance = String(valeur || '').trim().match(/^(\d+(?:[.,]\d+)?)\s*m\b/i);
  if (!correspondance) return null;
  return Number.parseFloat(correspondance[1].replace(',', '.'));
};

export const formatMeters = (valeur: number): string => Number.isInteger(valeur)
  ? String(valeur)
  : String(valeur).replace('.', ',');
