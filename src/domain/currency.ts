export const COIN_IDS = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;
export type CoinId = (typeof COIN_IDS)[number];
export type CoinPurse = Record<CoinId, number>;

export const COIN_LABELS: Record<CoinId, string> = {
  cp: 'PC', sp: 'PA', ep: 'PE', gp: 'PO', pp: 'PP',
};

export const COIN_COPPER_VALUES: Record<CoinId, number> = {
  cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000,
};

export function normalizeCoins(value: Partial<CoinPurse> | null | undefined): CoinPurse {
  return Object.fromEntries(COIN_IDS.map((id) => [id, Math.max(0, Math.floor(Number(value?.[id]) || 0))])) as CoinPurse;
}

export function coinTotalCopper(value: Partial<CoinPurse> | null | undefined): number {
  const coins = normalizeCoins(value);
  return COIN_IDS.reduce((total, id) => total + coins[id] * COIN_COPPER_VALUES[id], 0);
}

export function coinTotalGp(value: Partial<CoinPurse> | null | undefined): number {
  return coinTotalCopper(value) / 100;
}

export function coinsFromCopper(copper: number): CoinPurse {
  let remaining = Math.max(0, Math.round(Number(copper) || 0));
  const coins = normalizeCoins(null);
  for (const id of ['pp', 'gp', 'ep', 'sp', 'cp'] as CoinId[]) {
    coins[id] = Math.floor(remaining / COIN_COPPER_VALUES[id]);
    remaining %= COIN_COPPER_VALUES[id];
  }
  return coins;
}

export function coinsFromGp(gold: number): CoinPurse {
  return coinsFromCopper(Math.round(Math.max(0, Number(gold) || 0) * 100));
}

export function spendCoinValue(value: Partial<CoinPurse>, goldCost: number): CoinPurse | null {
  const remaining = coinTotalCopper(value) - Math.round(Math.max(0, Number(goldCost) || 0) * 100);
  return remaining < 0 ? null : coinsFromCopper(remaining);
}

export function addCoinValue(value: Partial<CoinPurse>, goldValue: number): CoinPurse {
  return coinsFromCopper(coinTotalCopper(value) + Math.round(Math.max(0, Number(goldValue) || 0) * 100));
}

// Cinquante pièces pèsent une livre ; l'application affiche les masses en kilogrammes.
export function coinWeightKg(value: Partial<CoinPurse> | null | undefined): number {
  const count = Object.values(normalizeCoins(value)).reduce((total, amount) => total + amount, 0);
  return count * 0.45359237 / 50;
}
