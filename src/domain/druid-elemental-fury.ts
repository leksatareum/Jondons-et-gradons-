import { formatMeters, parseMeters } from './meters';

export type ElementalFuryChoice = 'frappe-primordiale' | 'incantation-puissante' | null;

export type ElementalFuryCharacter = {
  classId?: string;
  level?: number;
  classLevels?: Array<{ classId?: string; id?: string; level?: number }>;
  classSelections?: Record<string, Record<string, unknown>>;
  classChoices?: Record<string, unknown>;
  abilities?: Record<string, number>;
  turn?: Record<string, unknown>;
};

export type ElementalFurySpell = {
  lv?: number;
  r?: string;
};

const druidLevel = (character: ElementalFuryCharacter): number => {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return Number(entry?.level || (character.classId === 'druide' ? character.level : 0) || 0);
};

const wisdomModifier = (character: ElementalFuryCharacter): number =>
  Math.floor((Number(character.abilities?.wis ?? 10) - 10) / 2);

export function druidElementalFuryChoice(character: ElementalFuryCharacter): ElementalFuryChoice {
  if (druidLevel(character) < 7) return null;
  const stored = character.classSelections?.druide?.elementalFury
    ?? (character.classId === 'druide' ? character.classChoices?.elementalFury : null);
  const raw = Array.isArray(stored) ? stored[0] : stored;
  return raw === 'frappe-primordiale' || raw === 'incantation-puissante' ? raw : null;
}

export function druidPrimalStrikeDamage(character: ElementalFuryCharacter): string | null {
  if (druidElementalFuryChoice(character) !== 'frappe-primordiale') return null;
  return druidLevel(character) >= 15 ? '2d8' : '1d8';
}

export function druidPrimalStrikeAvailable(character: ElementalFuryCharacter): boolean {
  return !!druidPrimalStrikeDamage(character) && !character.turn?.primalStrikeUsed;
}

export const DRUID_ELEMENTAL_DAMAGE_TYPES = ['froid', 'feu', 'foudre', 'tonnerre'] as const;
export type DruidElementalDamageType = typeof DRUID_ELEMENTAL_DAMAGE_TYPES[number];

export function normalizeDruidElementalDamageType(value: unknown): DruidElementalDamageType | null {
  const normalized = String(value || '').trim().toLocaleLowerCase('fr')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized === 'froid') return 'froid';
  if (normalized === 'feu') return 'feu';
  if (normalized === 'foudre') return 'foudre';
  if (normalized === 'tonnerre') return 'tonnerre';
  return null;
}

export function druidPotentSpellcastingDamageBonus(
  character: ElementalFuryCharacter,
  spell: ElementalFurySpell,
  sourceClass: string | null | undefined,
): number | null {
  if (druidElementalFuryChoice(character) !== 'incantation-puissante') return null;
  if (sourceClass !== 'druide' || Number(spell.lv) !== 0) return null;
  return wisdomModifier(character);
}

export function druidPotentSpellcastingDamageFormula(
  character: ElementalFuryCharacter,
  spell: ElementalFurySpell,
  sourceClass: string | null | undefined,
  baseFormula: string | null | undefined,
): string | null {
  if (!baseFormula) return baseFormula || null;
  const bonus = druidPotentSpellcastingDamageBonus(character, spell, sourceClass);
  if (bonus == null || bonus === 0) return baseFormula;
  return `${baseFormula}${bonus > 0 ? '+' : ''}${bonus}`;
}

export function druidPotentSpellcastingRangeLabel(
  character: ElementalFuryCharacter,
  spell: ElementalFurySpell,
  sourceClass: string | null | undefined,
): string {
  const base = String(spell.r || '—');
  if (druidLevel(character) < 15 || druidElementalFuryChoice(character) !== 'incantation-puissante') return base;
  if (sourceClass !== 'druide' || Number(spell.lv) !== 0) return base;
  const meters = parseMeters(spell.r);
  if (meters == null || meters < 3) return base;
  return `${formatMeters(meters + 90)} m`;
}
