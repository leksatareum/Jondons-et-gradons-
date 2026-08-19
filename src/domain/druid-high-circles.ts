import { landWardResistance } from './druid-land-stars';
import {
  activateWrathOfSea,
  druidLevelForSubclass,
  druidSubclassFor,
  spendWildShape,
  wisdomModifier,
  type DruidSubclassCharacter,
} from './druid-level3-subclasses';

export type HighCircleCharacter = DruidSubclassCharacter & {
  cosmicOmenMode?: 'weal' | 'woe' | null;
  cosmicOmenUsed?: number;
};

const isLand = (character: HighCircleCharacter) => /cercle de la terre|circle of the land|\bterre\b/i.test(druidSubclassFor(character));
const isSea = (character: HighCircleCharacter) => /cercle de la mer|circle of the sea|\bmer\b/i.test(druidSubclassFor(character));
const isStars = (character: HighCircleCharacter) => /cercle des étoiles|circle of the stars|\bétoiles?\b|\bstars?\b/i.test(druidSubclassFor(character));

export function natureSanctuaryRules(character: HighCircleCharacter): {
  cubeMeters: number;
  rangeMeters: number;
  moveMeters: number;
  durationRounds: number;
  allyResistance: string | null;
} | null {
  if (!isLand(character) || druidLevelForSubclass(character) < 14) return null;
  return { cubeMeters: 4.5, rangeMeters: 36, moveMeters: 18, durationRounds: 10, allyResistance: landWardResistance(character) };
}

export function activateNatureSanctuary(character: HighCircleCharacter): HighCircleCharacter {
  const rules = natureSanctuaryRules(character);
  if (!rules) return character;
  const spent = spendWildShape(character);
  if (spent === character) return character;
  const conditions = (spent.conditions || []).filter((condition) => condition.label !== 'Sanctuaire de la nature');
  return {
    ...spent,
    conditions: [...conditions, {
      label: 'Sanctuaire de la nature',
      detail: `Cube ${rules.cubeMeters} m · portée ${rules.rangeMeters} m · demi-abri · alliés : résistance ${rules.allyResistance || 'de Garde de la nature'}`,
      remainingRounds: rules.durationRounds,
      endsWhenIncapacitated: true,
    }],
  };
}

export function dismissNatureSanctuary(character: HighCircleCharacter): HighCircleCharacter {
  if (!(character.conditions || []).some((condition) => condition.label === 'Sanctuaire de la nature')) return character;
  return { ...character, conditions: (character.conditions || []).filter((condition) => condition.label !== 'Sanctuaire de la nature') };
}

export function oceanicGiftAvailable(character: HighCircleCharacter): boolean {
  return isSea(character) && druidLevelForSubclass(character) >= 14;
}

export function activateOceanicGift(
  character: HighCircleCharacter,
  mode: 'ally' | 'both',
  allyName: string,
): HighCircleCharacter {
  if (!oceanicGiftAvailable(character) || !allyName.trim()) return character;
  const shape = (character.resources || []).find((resource) => resource.name === 'Forme sauvage');
  const cost = mode === 'both' ? 2 : 1;
  if (!shape || shape.current < cost) return character;

  const first = activateWrathOfSea(character);
  if (first === character || !first.wrathOfSea) return character;
  const spent = mode === 'both' ? spendWildShape(first) : first;
  if (mode === 'both' && spent === first) return character;

  return {
    ...spent,
    wrathOfSea: {
      ...first.wrathOfSea,
      host: mode === 'both' ? 'both' : 'ally',
      allyName: allyName.trim(),
    },
  };
}

export function cosmicOmenMaxUses(character: HighCircleCharacter): number {
  if (!isStars(character) || druidLevelForSubclass(character) < 6) return 0;
  return Math.max(1, wisdomModifier(character));
}

export function cosmicOmenRemaining(character: HighCircleCharacter): number {
  return Math.max(0, cosmicOmenMaxUses(character) - Math.max(0, Number(character.cosmicOmenUsed || 0)));
}

export function consultCosmicOmen(character: HighCircleCharacter, roll: number): HighCircleCharacter {
  if (cosmicOmenMaxUses(character) <= 0 || character.cosmicOmenMode) return character;
  const die = Math.max(1, Math.floor(Number(roll) || 1));
  return { ...character, cosmicOmenMode: die % 2 === 0 ? 'weal' : 'woe', cosmicOmenUsed: 0 };
}

export function useCosmicOmen(character: HighCircleCharacter, d6: number): {
  character: HighCircleCharacter;
  modifier: number;
  mode: 'weal' | 'woe';
} | null {
  if (!character.cosmicOmenMode || cosmicOmenRemaining(character) <= 0) return null;
  const die = Math.max(1, Math.min(6, Math.floor(Number(d6) || 1)));
  const mode = character.cosmicOmenMode;
  return {
    character: { ...character, cosmicOmenUsed: Number(character.cosmicOmenUsed || 0) + 1 },
    modifier: mode === 'weal' ? die : -die,
    mode,
  };
}

export function resetHighCircleLongRest(character: HighCircleCharacter): HighCircleCharacter {
  return {
    ...character,
    cosmicOmenMode: null,
    cosmicOmenUsed: 0,
    conditions: (character.conditions || []).filter((condition) => condition.label !== 'Sanctuaire de la nature'),
  };
}
