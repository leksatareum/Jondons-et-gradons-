type ClassLevel = { classId: string; level: number; subclass?: string | null };
type Resource = { name: string; current: number; max: number; [key: string]: unknown };
type InitiativeCharacter = {
  classId?: string;
  level?: number;
  subclass?: string | null;
  classLevels?: ClassLevel[];
  resources?: Resource[];
  inspiration?: boolean;
  hp: number;
  hpMax: number;
  turn?: Record<string, unknown>;
  pendingInitiativeChoice?: 'uncanny-metabolism' | null;
  pendingSelfRestoration?: string[] | null;
  [key: string]: unknown;
};

type TimedCondition = {
  label: string;
  remainingRounds?: number;
  expires?: 'end-next-turn';
  armedForExpiry?: boolean;
  [key: string]: unknown;
};

const conditionsOf = (character: InitiativeCharacter): TimedCondition[] =>
  Array.isArray(character.conditions) ? character.conditions as TimedCondition[] : [];

/**
 * Les durées sont attachées au tour du personnage qui a créé l'effet.
 * Une durée de dix rounds activée pendant son tour disparaît donc au début
 * de son onzième tour. Les effets « fin de ton prochain tour » sont armés au
 * début du prochain tour puis retirés par applyEndOfTurn.
 */
export function advanceTimedConditionsAtStart(character: InitiativeCharacter): TimedCondition[] {
  return conditionsOf(character).flatMap((condition) => {
    if (condition.expires === 'end-next-turn' && !condition.armedForExpiry) {
      return [{ ...condition, armedForExpiry: true }];
    }
    if (typeof condition.remainingRounds !== 'number') return [condition];
    const remainingRounds = condition.remainingRounds - 1;
    return remainingRounds > 0 ? [{ ...condition, remainingRounds }] : [];
  });
}

export function applyEndOfTurn(character: InitiativeCharacter): InitiativeCharacter {
  const removable = levelOf(character, 'moine') >= 10
    ? conditionsOf(character).filter((condition) => ['Charmé', 'Effrayé', 'Empoisonné'].includes(condition.label)).map((condition) => condition.label)
    : [];
  return {
    ...character,
    conditions: conditionsOf(character).filter((condition) =>
      !(condition.expires === 'end-next-turn' && condition.armedForExpiry)),
    pendingSelfRestoration: removable.length ? [...new Set(removable)] : null,
  };
}

export function useSelfRestoration(character: InitiativeCharacter, conditionLabel: string): InitiativeCharacter {
  if (!(character.pendingSelfRestoration || []).includes(conditionLabel)) return character;
  return {
    ...character,
    conditions: conditionsOf(character).filter((condition) => condition.label !== conditionLabel),
    pendingSelfRestoration: null,
  };
}

export function declineSelfRestoration(character: InitiativeCharacter): InitiativeCharacter {
  return { ...character, pendingSelfRestoration: null };
}

const levelOf = (character: InitiativeCharacter, classId: string): number => {
  const levels = character.classLevels?.length
    ? character.classLevels
    : character.classId ? [{ classId: character.classId, level: character.level || 1, subclass: character.subclass }] : [];
  return levels.find((entry) => entry.classId === classId)?.level || 0;
};

const subclassOf = (character: InitiativeCharacter, classId: string): string | null | undefined => {
  const entry = character.classLevels?.find((level) => level.classId === classId);
  return entry?.subclass || (character.classId === classId ? character.subclass : null);
};

const updateResource = (resources: Resource[] | undefined, name: string, update: (resource: Resource) => Resource): Resource[] =>
  (resources || []).map((resource) => resource.name === name ? update(resource) : resource);

export function martialArtsDie(monkLevel: number): number {
  if (monkLevel >= 17) return 12;
  if (monkLevel >= 11) return 10;
  if (monkLevel >= 5) return 8;
  return 6;
}

const initiativeTurn = () => ({
  turnBased: true,
  action: false,
  bonus: false,
  reaction: false,
  spellSlotCast: false,
  extraActions: 0,
  attacksRemaining: 0,
  loadingWeaponIds: [],
  relentlessUsed: false,
  cleaveUsed: false,
  cleaveAvailable: null,
  lightWeaponUsedId: null,
  lightAttackUsed: false,
  nickUsed: false,
  dualWielderUsed: false,
});

export function applyInitiativeRoll(character: InitiativeCharacter): InitiativeCharacter {
  const bardLevel = levelOf(character, 'barde');
  const monkLevel = levelOf(character, 'moine');
  let resources = character.resources || [];
  if (bardLevel >= 18) {
    resources = updateResource(resources, 'Inspiration bardique', (resource) => ({
      ...resource,
      current: Math.min(resource.max, Math.max(resource.current, 2)),
    }));
  }
  // PHB 2024 : la récupération à l'initiative est « Forme sauvage pérenne »,
  // un bénéfice d'Archidruide niveau 20 — pas Résurgence sauvage niveau 5.
  const druidLevel = levelOf(character, 'druide');
  if (druidLevel >= 20) {
    const wildShape = resources.find((resource) => resource.name === 'Forme sauvage');
    if (wildShape && wildShape.current === 0) {
      resources = updateResource(resources, 'Forme sauvage', (resource) => ({ ...resource, current: 1 }));
    }
  }
  const metabolism = resources.find((resource) => resource.name === 'Métabolisme surnaturel');
  const pendingInitiativeChoice = monkLevel >= 2 && (metabolism?.current || 0) > 0
    ? 'uncanny-metabolism'
    : null;
  if (monkLevel >= 15 && !pendingInitiativeChoice) {
    resources = updateResource(resources, 'Concentration du moine', (resource) => ({
      ...resource,
      current: resource.current <= 3 ? Math.min(resource.max, 4) : resource.current,
    }));
  }
  return {
    ...character,
    resources,
    pendingInitiativeChoice,
    turn: initiativeTurn(),
  };
}

export function declineUncannyMetabolism(character: InitiativeCharacter): InitiativeCharacter {
  const monkLevel = levelOf(character, 'moine');
  const resources = monkLevel >= 15
    ? updateResource(character.resources, 'Concentration du moine', (resource) => ({
        ...resource,
        current: resource.current <= 3 ? Math.min(resource.max, 4) : resource.current,
      }))
    : character.resources || [];
  return { ...character, resources, pendingInitiativeChoice: null };
}

export function useUncannyMetabolism(character: InitiativeCharacter, martialArtsRoll: number): InitiativeCharacter {
  const monkLevel = levelOf(character, 'moine');
  const metabolism = character.resources?.find((resource) => resource.name === 'Métabolisme surnaturel');
  if (character.pendingInitiativeChoice !== 'uncanny-metabolism' || monkLevel < 2 || !metabolism || metabolism.current <= 0) {
    return character;
  }
  let resources = updateResource(character.resources, 'Concentration du moine', (resource) => ({ ...resource, current: resource.max }));
  resources = updateResource(resources, 'Métabolisme surnaturel', (resource) => ({ ...resource, current: resource.current - 1 }));
  const healing = monkLevel + Math.max(1, Math.min(martialArtsDie(monkLevel), Math.floor(martialArtsRoll)));
  return { ...character, resources, hp: Math.min(character.hpMax, character.hp + healing), pendingInitiativeChoice: null };
}

export function applyStartOfTurn(character: InitiativeCharacter): InitiativeCharacter {
  const fighterLevel = levelOf(character, 'guerrier');
  const champion = /champion/i.test(subclassOf(character, 'guerrier') || '');
  return {
    ...character,
    conditions: advanceTimedConditionsAtStart(character),
    inspiration: fighterLevel >= 10 && champion ? true : character.inspiration,
    turn: initiativeTurn(),
  };
}
