import { landWardResistance, type LandStarsCharacter } from './druid-land-stars';
import { seaStormbornBenefits, starryFormResistances, type DruidSubclassCharacter } from './druid-level3-subclasses';
import type { DamageProfile } from './damage';

export type DruidDefenseCharacter = LandStarsCharacter & DruidSubclassCharacter & DamageProfile;

export function druidDynamicResistances(character: DruidDefenseCharacter): string[] {
  const resistance = landWardResistance(character);
  return [...new Set([
    ...(resistance ? [resistance] : []),
    ...seaStormbornBenefits(character).resistances,
    ...starryFormResistances(character),
  ])];
}

export function withDruidDynamicDamageProfile<T extends DruidDefenseCharacter>(character: T): T & DamageProfile {
  const dynamic = druidDynamicResistances(character);
  if (dynamic.length === 0) return character;
  return {
    ...character,
    resistances: [...new Set([...(character.resistances || []), ...dynamic])],
  };
}

export function druidConditionImmune(character: DruidDefenseCharacter, conditionLabel: string): boolean {
  return conditionLabel === 'Empoisonné' && landWardResistance(character) !== null;
}
