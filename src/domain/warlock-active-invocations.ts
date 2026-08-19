export type InvocationSpellGrant = {
  invocationId: string;
  id: string;
  freeCast?: 'unlimited';
  freeRecharge?: 'long';
  selfOnly?: boolean;
  condition?: 'dim-or-dark';
  featureName: string;
};

const selectedInvocationIds = (classSelections: Record<string, any> = {}): string[] => {
  const raw = classSelections?.occultiste?.invocations || [];
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
};

const hasInvocation = (classSelections: Record<string, any>, id: string): boolean =>
  selectedInvocationIds(classSelections).some((optionId) => optionId.split('@')[0] === id);

export const WARLOCK_ACTIVE_INVOCATION_SPELLS: InvocationSpellGrant[] = [
  { invocationId: 'armor-of-shadows', id: 'armure-mage', freeCast: 'unlimited', selfOnly: true, featureName: 'Armure des ombres' },
  { invocationId: 'ascendant-step', id: 'levitation', freeCast: 'unlimited', selfOnly: true, featureName: 'Pas ascendant' },
  { invocationId: 'fiendish-vigor', id: 'simulacre-vie', freeCast: 'unlimited', selfOnly: true, featureName: 'Vigueur fiélonne' },
  { invocationId: 'mask-many-faces', id: 'deguisement', freeCast: 'unlimited', selfOnly: true, featureName: 'Masque aux mille visages' },
  { invocationId: 'master-myriad-forms', id: 'metamorphose-mineure', freeCast: 'unlimited', selfOnly: true, featureName: 'Maître des mille formes' },
  { invocationId: 'misty-visions', id: 'image-illusoire', freeCast: 'unlimited', featureName: 'Visions brumeuses' },
  { invocationId: 'one-with-shadows', id: 'invisibilite', freeCast: 'unlimited', selfOnly: true, condition: 'dim-or-dark', featureName: 'Un avec les ombres' },
  { invocationId: 'otherworldly-leap', id: 'jump', freeCast: 'unlimited', selfOnly: true, featureName: 'Bond d’outre-monde' },
  { invocationId: 'gift-of-the-depths', id: 'respiration-aquatique', freeRecharge: 'long', featureName: 'Don des profondeurs' },
  { invocationId: 'whispers-grave', id: 'parler-morts', freeCast: 'unlimited', featureName: 'Murmures de la tombe' },
  { invocationId: 'visions-distant-realms', id: 'oeil-arcanique', freeCast: 'unlimited', featureName: 'Visions des royaumes lointains' },
];

export function invocationSpellGrants(classSelections: Record<string, any> = {}): InvocationSpellGrant[] {
  return WARLOCK_ACTIVE_INVOCATION_SPELLS.filter((entry) => hasInvocation(classSelections, entry.invocationId));
}

export function warlockInvocationPassives(character: any) {
  const selections = character?.classSelections || (character?.classId === 'occultiste' ? { occultiste: character.classChoices || {} } : {});
  return {
    devilsSightRangeMeters: hasInvocation(selections, 'devils-sight') ? 36 : 0,
    waterBreathing: hasInvocation(selections, 'gift-of-the-depths'),
    swimSpeedEqualsSpeed: hasInvocation(selections, 'gift-of-the-depths'),
  };
}

export function fiendishVigorTemporaryHp(classSelections: Record<string, any>, spellId: string): number | null {
  return spellId === 'simulacre-vie' && hasInvocation(classSelections, 'fiendish-vigor') ? 12 : null;
}
