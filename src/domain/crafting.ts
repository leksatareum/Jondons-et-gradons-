export type CraftingPlan = {
  materialCostGp: number;
  laborDays: number;
};

// La bourse de l'application descend jusqu'à la pièce de cuivre. Une moitié de
// prix est donc arrondie vers le bas à cette unité, conformément au Manuel.
export function nonmagicalCraftingPlan(purchaseCostGp: number): CraftingPlan {
  const price = Math.max(0, Number(purchaseCostGp) || 0);
  return {
    materialCostGp: Math.floor(price * 50) / 100,
    laborDays: Math.max(1, Math.ceil(price / 10)),
  };
}

export function healingPotionCraftingPlan(): CraftingPlan {
  return { materialCostGp: 25, laborDays: 1 };
}

// Manuel des joueurs 2024, « Scribing a Spell Scroll ». Le coût ne comprend
// pas les composantes matérielles coûteuses du sort, qui restent à fournir.
const SPELL_SCROLL_TABLE: Record<number, CraftingPlan> = {
  0: { materialCostGp: 15, laborDays: 1 },
  1: { materialCostGp: 25, laborDays: 1 },
  2: { materialCostGp: 100, laborDays: 3 },
  3: { materialCostGp: 150, laborDays: 5 },
  4: { materialCostGp: 1000, laborDays: 10 },
  5: { materialCostGp: 1500, laborDays: 25 },
  6: { materialCostGp: 10000, laborDays: 40 },
  7: { materialCostGp: 12500, laborDays: 50 },
  8: { materialCostGp: 15000, laborDays: 60 },
  9: { materialCostGp: 50000, laborDays: 120 },
};

export function spellScrollCraftingPlan(spellLevel: number): CraftingPlan {
  const level = Math.max(0, Math.min(9, Math.floor(Number(spellLevel) || 0)));
  return { ...SPELL_SCROLL_TABLE[level] };
}

export function craftingCalendarDays(laborDays: number, workers: number): number {
  return Math.max(1, Math.ceil(Math.max(1, laborDays) / Math.max(1, workers)));
}
