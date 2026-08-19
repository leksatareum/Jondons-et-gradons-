import { WILD_SHAPE_PROFILES, isMoonDruid, type WildShapeCharacter } from './wild-shape';

export type WildShapeModifierResult = {
  modifier: number;
  source: 'character' | 'beast';
};

const abilityMod = (score: number) => Math.floor((score - 10) / 2);

const activeProfile = (character: WildShapeCharacter) => character.activeWildShape
  ? WILD_SHAPE_PROFILES.find((profile) => profile.id === character.activeWildShape?.formId) || null
  : null;

const druidLevel = (character: WildShapeCharacter): number => {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return Number(entry?.level || (character.classId === 'druide' ? character.level : 0) || 0);
};

export function effectiveWildShapeSaveModifier(
  character: WildShapeCharacter,
  ability: string,
  proficiencyBonus: number,
  characterProficient: boolean,
): WildShapeModifierResult {
  const own = abilityMod(Number(character.abilities?.[ability] ?? 10)) + (characterProficient ? proficiencyBonus : 0);
  const beast = activeProfile(character)?.saveOverrides?.[ability as 'str' | 'dex' | 'con'];
  const beastWins = beast != null && beast > own;
  const base = beastWins ? beast : own;
  const lunarToughness = ability === 'con' && character.activeWildShape && isMoonDruid(character) && druidLevel(character) >= 6
    ? abilityMod(Number(character.abilities?.wis ?? 10))
    : 0;
  return { modifier: base + lunarToughness, source: beastWins ? 'beast' : 'character' };
}

export function effectiveWildShapeSkillModifier(
  character: WildShapeCharacter,
  skillId: string,
  ability: string,
  proficiencyBonus: number,
  characterProficient: boolean,
  characterExpertise: boolean,
  characterExtraBonus = 0,
): WildShapeModifierResult {
  const proficiency = characterExpertise ? proficiencyBonus * 2 : characterProficient ? proficiencyBonus : 0;
  const own = abilityMod(Number(character.abilities?.[ability] ?? 10)) + proficiency + characterExtraBonus;
  const beast = activeProfile(character)?.skillOverrides?.[skillId];
  if (beast != null && beast > own) return { modifier: beast, source: 'beast' };
  return { modifier: own, source: 'character' };
}
