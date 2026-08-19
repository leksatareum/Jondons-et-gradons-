/**
 * Catalogue des armures — SRD 5.2 (licence CC-BY 4.0). Repêché de
 * `table-connectee/src/App.jsx` (`ARMORS`, `ARMOR_PRICES`, `armorTiming`).
 * Confiance haute : données du SRD, stables depuis 2014.
 */
export interface ArmorDef {
  id: string;
  name: string;
  cat: '—' | 'Légère' | 'Intermédiaire' | 'Lourde';
  /** Classe d'armure de base, avant modificateur de Dextérité. */
  base: number;
  /** `null` = pas de plafond (armures légères) ; `0` = Dextérité non ajoutée (armures lourdes). */
  dexCap: number | null;
  /** Force minimale requise, 0 si aucune. */
  str: number;
  /** Désavantage aux tests de Discrétion. */
  stealth: boolean;
  weight: number;
}

export const ARMORS: ArmorDef[] = [
  { id: 'none', name: 'Sans armure', cat: '—', base: 10, dexCap: null, str: 0, stealth: false, weight: 0 },
  { id: 'matelassee', name: 'Armure matelassée', cat: 'Légère', base: 11, dexCap: null, str: 0, stealth: true, weight: 3.5 },
  { id: 'cuir', name: 'Armure de cuir', cat: 'Légère', base: 11, dexCap: null, str: 0, stealth: false, weight: 4.5 },
  { id: 'cuirclou', name: 'Armure de cuir clouté', cat: 'Légère', base: 12, dexCap: null, str: 0, stealth: false, weight: 6 },
  { id: 'peaux', name: 'Armure de peaux', cat: 'Intermédiaire', base: 12, dexCap: 2, str: 0, stealth: false, weight: 5.5 },
  { id: 'chemise', name: 'Chemise de mailles', cat: 'Intermédiaire', base: 13, dexCap: 2, str: 0, stealth: false, weight: 9 },
  { id: 'ecailles', name: "Armure d'écailles", cat: 'Intermédiaire', base: 14, dexCap: 2, str: 0, stealth: true, weight: 20 },
  { id: 'cuirasse', name: 'Cuirasse', cat: 'Intermédiaire', base: 14, dexCap: 2, str: 0, stealth: false, weight: 9 },
  { id: 'demiplate', name: 'Demi-plate', cat: 'Intermédiaire', base: 15, dexCap: 2, str: 0, stealth: true, weight: 18 },
  { id: 'anneaux', name: "Cotte d'anneaux", cat: 'Lourde', base: 14, dexCap: 0, str: 0, stealth: true, weight: 18 },
  { id: 'mailles', name: 'Cotte de mailles', cat: 'Lourde', base: 16, dexCap: 0, str: 13, stealth: true, weight: 25 },
  { id: 'clibanion', name: 'Clibanion', cat: 'Lourde', base: 17, dexCap: 0, str: 15, stealth: true, weight: 27 },
  { id: 'plates', name: 'Harnois', cat: 'Lourde', base: 18, dexCap: 0, str: 15, stealth: true, weight: 30 },
];

export const ARMOR_PRICES: Record<string, number> = {
  matelassee: 5, cuir: 10, cuirclou: 45, peaux: 10, chemise: 50, ecailles: 50,
  cuirasse: 400, demiplate: 750, anneaux: 30, mailles: 75, clibanion: 200, plates: 1500,
};

export const SHIELD = { id: 'bouclier', name: 'Bouclier', bonus: 2, price: 10, weight: 2.7 };

export const armorById = (id: string): ArmorDef | undefined => ARMORS.find((armor) => armor.id === id);

/** Temps pour enfiler/retirer, selon la catégorie — vérifié PHB 2024. */
export const armorTiming = (armor: ArmorDef): { don: string; doff: string } => {
  if (armor.cat === 'Légère' || armor.cat === '—') return { don: '1 minute', doff: '1 minute' };
  if (armor.cat === 'Intermédiaire') return { don: '5 minutes', doff: '1 minute' };
  return { don: '10 minutes', doff: '5 minutes' };
};

/** Classe d'armure effective, en tenant compte du plafond de Dextérité. */
export const armorClassFor = (armor: ArmorDef, dexterityModifier: number): number =>
  armor.base + (armor.dexCap === null ? dexterityModifier : Math.min(dexterityModifier, armor.dexCap));
