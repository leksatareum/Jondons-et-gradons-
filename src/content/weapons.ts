/**
 * Catalogue des armes — SRD 5.2 (licence CC-BY 4.0), avec leur maîtrise
 * PHB 2024. Repêché de `table-connectee/src/App.jsx` (`WEAPONS`,
 * `WEAPON_PRICES`, `MASTERIES`). Confiance haute : données du SRD, stables,
 * cohérentes avec les huit maîtrises déjà portées dans
 * `src/domain/weapon-mastery.ts` (même nom exact pour chacune).
 */
import type { WeaponMasteryName } from '../domain/weapon-mastery';

export interface WeaponDef {
  id: string;
  name: string;
  cat: 'simple' | 'martial';
  melee: boolean;
  die: number;
  diceCount?: number;
  fixed?: number;
  dmg: string;
  props: string;
  mastery: WeaponMasteryName;
  weight: number;
  finesse?: boolean;
  /** Prix en pièces d'or ; absent si couvert par `WEAPON_PRICES`. */
  cost?: string;
}

export const WEAPON_MASTERIES: Record<WeaponMasteryName, { en: string; desc: string }> = {
  Fauchage: { en: 'Cleave', desc: "Après avoir touché en corps à corps, tu peux attaquer une seconde créature à 1,50 m de la première. Les dégâts n'incluent pas ton modificateur. Une fois par tour." },
  Éraflure: { en: 'Graze', desc: "Si tu rates, tu infliges quand même des dégâts égaux au modificateur utilisé pour l'attaque." },
  Entaille: { en: 'Nick', desc: "L'attaque supplémentaire de la propriété Légère devient partie de l'action Attaquer au lieu de coûter une action bonus." },
  Repoussement: { en: 'Push', desc: 'Si tu touches, tu peux repousser la créature de 3 mètres en ligne droite (taille G ou moins).' },
  Affaiblissement: { en: 'Sap', desc: 'Si tu touches, la créature a un désavantage à sa prochaine attaque avant le début de ton prochain tour.' },
  Ralentissement: { en: 'Slow', desc: "Si tu touches et infliges des dégâts, la vitesse de la créature baisse de 3 mètres jusqu'à ton prochain tour." },
  Renversement: { en: 'Topple', desc: "Si tu touches, la créature fait une sauvegarde de Constitution (DD 8 + modificateur d'attaque + maîtrise) ou tombe à terre." },
  Harcèlement: { en: 'Vex', desc: 'Si tu touches et infliges des dégâts, tu as l’avantage à ta prochaine attaque contre cette créature.' },
};

export const WEAPONS: WeaponDef[] = [
  // Simples de corps à corps
  { id: 'gourdin', name: 'Gourdin', cat: 'simple', melee: true, die: 4, dmg: 'contondants', props: 'Légère', mastery: 'Ralentissement', weight: 0.9 },
  { id: 'dague', name: 'Dague', cat: 'simple', melee: true, die: 4, dmg: 'perforants', props: 'Finesse, légère, lancer (6/18)', mastery: 'Entaille', weight: 0.5, finesse: true },
  { id: 'massue', name: 'Massue', cat: 'simple', melee: true, die: 8, dmg: 'contondants', props: 'Deux mains', mastery: 'Repoussement', weight: 4.5 },
  { id: 'hachette', name: 'Hachette', cat: 'simple', melee: true, die: 6, dmg: 'tranchants', props: 'Légère, lancer (6/18)', mastery: 'Harcèlement', weight: 0.9 },
  { id: 'javeline', name: 'Javeline', cat: 'simple', melee: true, die: 6, dmg: 'perforants', props: 'Lancer (9/36)', mastery: 'Ralentissement', weight: 0.9 },
  { id: 'marteau', name: 'Marteau léger', cat: 'simple', melee: true, die: 4, dmg: 'contondants', props: 'Légère, lancer (6/18)', mastery: 'Entaille', weight: 0.9 },
  { id: 'masse', name: "Masse d'armes", cat: 'simple', melee: true, die: 6, dmg: 'contondants', props: '—', mastery: 'Affaiblissement', weight: 1.8 },
  { id: 'baton', name: 'Bâton de combat', cat: 'simple', melee: true, die: 6, dmg: 'contondants', props: 'Polyvalente (1d8)', mastery: 'Renversement', weight: 1.8 },
  { id: 'serpe', name: 'Serpe', cat: 'simple', melee: true, die: 4, dmg: 'tranchants', props: 'Légère', mastery: 'Entaille', weight: 0.9 },
  { id: 'lance', name: 'Lance', cat: 'simple', melee: true, die: 6, dmg: 'perforants', props: 'Lancer (6/18), polyvalente (1d8)', mastery: 'Affaiblissement', weight: 1.4 },
  // Simples à distance
  { id: 'flechette', name: 'Fléchette', cat: 'simple', melee: false, die: 4, dmg: 'perforants', props: 'Finesse, lancer (6/18)', mastery: 'Harcèlement', weight: 0.1, finesse: true },
  { id: 'arbalegere', name: 'Arbalète légère', cat: 'simple', melee: false, die: 8, dmg: 'perforants', props: 'Munitions (24/96), rechargement, deux mains', mastery: 'Ralentissement', weight: 2.3 },
  { id: 'arccourt', name: 'Arc court', cat: 'simple', melee: false, die: 6, dmg: 'perforants', props: 'Munitions (24/96), deux mains', mastery: 'Harcèlement', weight: 0.9 },
  { id: 'fronde', name: 'Fronde', cat: 'simple', melee: false, die: 4, dmg: 'contondants', props: 'Munitions (9/36)', mastery: 'Ralentissement', weight: 0 },
  // Martiales de corps à corps
  { id: 'hachedarme', name: "Hache d'armes", cat: 'martial', melee: true, die: 8, dmg: 'tranchants', props: 'Polyvalente (1d10)', mastery: 'Renversement', weight: 1.8 },
  { id: 'fleau', name: "Fléau d'armes", cat: 'martial', melee: true, die: 8, dmg: 'contondants', props: '—', mastery: 'Affaiblissement', weight: 0.9 },
  { id: 'coutille', name: 'Coutille', cat: 'martial', melee: true, die: 10, dmg: 'tranchants', props: 'Lourde, allonge, deux mains', mastery: 'Éraflure', weight: 2.7 },
  { id: 'grandehache', name: 'Grande hache', cat: 'martial', melee: true, die: 12, dmg: 'tranchants', props: 'Lourde, deux mains', mastery: 'Fauchage', weight: 3.2 },
  { id: 'epee2m', name: 'Épée à deux mains', cat: 'martial', melee: true, die: 6, diceCount: 2, dmg: 'tranchants', props: 'Lourde, deux mains', mastery: 'Éraflure', weight: 2.7 },
  { id: 'hallebarde', name: 'Hallebarde', cat: 'martial', melee: true, die: 10, dmg: 'tranchants', props: 'Lourde, allonge, deux mains', mastery: 'Fauchage', weight: 2.7 },
  { id: 'lancecav', name: 'Lance de cavalerie', cat: 'martial', melee: true, die: 10, dmg: 'perforants', props: 'Lourde, allonge, deux mains sauf monté', mastery: 'Renversement', weight: 2.7 },
  { id: 'epeelongue', name: 'Épée longue', cat: 'martial', melee: true, die: 8, dmg: 'tranchants', props: 'Polyvalente (1d10)', mastery: 'Affaiblissement', weight: 1.4 },
  { id: 'maillet', name: 'Maillet', cat: 'martial', melee: true, die: 6, diceCount: 2, dmg: 'contondants', props: 'Lourde, deux mains', mastery: 'Renversement', weight: 4.5 },
  { id: 'etoile', name: 'Étoile du matin', cat: 'martial', melee: true, die: 8, dmg: 'perforants', props: '—', mastery: 'Affaiblissement', weight: 1.8 },
  { id: 'pique', name: 'Pique', cat: 'martial', melee: true, die: 10, dmg: 'perforants', props: 'Lourde, allonge, deux mains', mastery: 'Repoussement', weight: 8.2 },
  { id: 'rapiere', name: 'Rapière', cat: 'martial', melee: true, die: 8, dmg: 'perforants', props: 'Finesse', mastery: 'Harcèlement', weight: 0.9, finesse: true },
  { id: 'cimeterre', name: 'Cimeterre', cat: 'martial', melee: true, die: 6, dmg: 'tranchants', props: 'Finesse, légère', mastery: 'Entaille', weight: 1.4, finesse: true },
  { id: 'epeecourte', name: 'Épée courte', cat: 'martial', melee: true, die: 6, dmg: 'perforants', props: 'Finesse, légère', mastery: 'Harcèlement', weight: 0.9, finesse: true },
  { id: 'trident', name: 'Trident', cat: 'martial', melee: true, die: 8, dmg: 'perforants', props: 'Lancer (6/18), polyvalente (1d10)', mastery: 'Renversement', weight: 1.8 },
  { id: 'marteauguerre', name: 'Marteau de guerre', cat: 'martial', melee: true, die: 8, dmg: 'contondants', props: 'Polyvalente (1d10)', mastery: 'Repoussement', weight: 2.3 },
  { id: 'picguerre', name: 'Pic de guerre', cat: 'martial', melee: true, die: 8, dmg: 'perforants', props: 'Polyvalente (1d10)', mastery: 'Affaiblissement', weight: 0.9 },
  { id: 'fouet', name: 'Fouet', cat: 'martial', melee: true, die: 4, dmg: 'tranchants', props: 'Finesse, allonge', mastery: 'Ralentissement', weight: 1.4, finesse: true },
  // Martiales à distance
  { id: 'sarbacane', name: 'Sarbacane', cat: 'martial', melee: false, die: 1, fixed: 1, dmg: 'perforants', props: 'Munitions (7,5/30), rechargement', mastery: 'Harcèlement', weight: 0.5 },
  { id: 'arbalemain', name: 'Arbalète de poing', cat: 'martial', melee: false, die: 6, dmg: 'perforants', props: 'Munitions (9/36), légère, rechargement', mastery: 'Harcèlement', weight: 1.4 },
  { id: 'arbalourde', name: 'Arbalète lourde', cat: 'martial', melee: false, die: 10, dmg: 'perforants', props: 'Munitions (30/120), lourde, rechargement, deux mains', mastery: 'Repoussement', weight: 8.2 },
  { id: 'arclong', name: 'Arc long', cat: 'martial', melee: false, die: 8, dmg: 'perforants', props: 'Munitions (45/180), lourde, deux mains', mastery: 'Ralentissement', weight: 0.9 },
  { id: 'mousquet', name: 'Mousquet', cat: 'martial', melee: false, die: 12, dmg: 'perforants', props: 'Munitions (12/36), rechargement, deux mains', mastery: 'Ralentissement', weight: 4.5, cost: '500 po' },
  { id: 'pistolet', name: 'Pistolet', cat: 'martial', melee: false, die: 10, dmg: 'perforants', props: 'Munitions (9/27), rechargement', mastery: 'Harcèlement', weight: 1.4, cost: '250 po' },
];

/** Prix en pièces d'or, pour les armes qui n'ont pas de champ `cost` dédié. */
export const WEAPON_PRICES: Record<string, number> = {
  gourdin: .1, dague: 2, massue: .2, hachette: 5, javeline: .5, marteau: 2, masse: 5, baton: .2, serpe: 1, lance: 1,
  flechette: .05, arbalegere: 25, arccourt: 25, fronde: .1,
  hachedarme: 10, fleau: 10, coutille: 20, grandehache: 30, epee2m: 50, hallebarde: 20, lancecav: 10,
  epeelongue: 15, maillet: 10, etoile: 15, pique: 5, rapiere: 25, cimeterre: 25, epeecourte: 10,
  trident: 5, marteauguerre: 15, picguerre: 5, fouet: 2,
  sarbacane: 10, arbalemain: 75, arbalourde: 50, arclong: 50, mousquet: 500, pistolet: 250,
};

export const weaponById = (id: string): WeaponDef | undefined => WEAPONS.find((weapon) => weapon.id === id);

/** Prix effectif : le champ `cost` de l'arme prime sur `WEAPON_PRICES`. */
export const weaponPriceGp = (id: string): number | undefined => {
  const weapon = weaponById(id);
  if (weapon?.cost) return Number.parseFloat(weapon.cost);
  return WEAPON_PRICES[id];
};
