export interface MasteryWeapon {
  id: string;
  cat: 'simple' | 'martial';
  melee: boolean;
  finesse?: boolean;
  props: string;
}

export type WeaponMasteryName =
  | 'Fauchage'
  | 'Éraflure'
  | 'Entaille'
  | 'Repoussement'
  | 'Affaiblissement'
  | 'Ralentissement'
  | 'Renversement'
  | 'Harcèlement';

export type WeaponAttackOutcome = 'hit' | 'miss';

export interface WeaponMasteryResolution {
  applies: boolean;
  kind: 'none' | 'immediate' | 'cleave' | 'timed' | 'save' | 'vex';
  detail: string;
  saveDC?: number;
}

export function isLightWeapon(weapon: Pick<MasteryWeapon, 'props'> | null | undefined): boolean {
  return /(?:^|,\s*)légère(?:,|$)/i.test(weapon?.props || '');
}

export function weaponMasteryResolution(
  mastery: WeaponMasteryName,
  outcome: WeaponAttackOutcome,
  options: { abilityModifier: number; proficiencyBonus: number; targetName?: string; alreadyUsed?: boolean },
): WeaponMasteryResolution {
  const target = options.targetName?.trim() || 'la cible';
  const hit = outcome === 'hit';
  switch (mastery) {
    case 'Fauchage':
      return hit && !options.alreadyUsed
        ? { applies: true, kind: 'cleave', detail: `Une attaque de Fauchage est disponible contre une autre créature proche de ${target}.` }
        : { applies: false, kind: 'none', detail: options.alreadyUsed ? 'Fauchage a déjà été utilisé ce tour.' : 'Fauchage exige une touche.' };
    case 'Éraflure': {
      const damage = Math.max(0, options.abilityModifier);
      return !hit
        ? { applies: true, kind: 'immediate', detail: `${target} subit ${damage} dégâts d’Éraflure du même type que l’arme.` }
        : { applies: false, kind: 'none', detail: 'Éraflure ne s’applique que sur un échec.' };
    }
    case 'Entaille':
      return { applies: false, kind: 'none', detail: 'Entaille modifie l’attaque supplémentaire de la propriété Légère, indépendamment du résultat.' };
    case 'Repoussement':
      return hit
        ? { applies: true, kind: 'immediate', detail: `${target} peut être repoussé de 3 m en ligne droite s’il est de taille G ou inférieure.` }
        : { applies: false, kind: 'none', detail: 'Repoussement exige une touche.' };
    case 'Affaiblissement':
      return hit
        ? { applies: true, kind: 'timed', detail: `${target} a le désavantage à sa prochaine attaque avant le début de ton prochain tour.` }
        : { applies: false, kind: 'none', detail: 'Affaiblissement exige une touche.' };
    case 'Ralentissement':
      return hit
        ? { applies: true, kind: 'timed', detail: `La vitesse de ${target} baisse de 3 m jusqu’au début de ton prochain tour (non cumulable).` }
        : { applies: false, kind: 'none', detail: 'Ralentissement exige une touche qui inflige des dégâts.' };
    case 'Renversement': {
      const saveDC = 8 + options.proficiencyBonus + options.abilityModifier;
      return hit
        ? { applies: true, kind: 'save', saveDC, detail: `${target} doit réussir une sauvegarde de Constitution DD ${saveDC} ou tomber À terre.` }
        : { applies: false, kind: 'none', detail: 'Renversement exige une touche.' };
    }
    case 'Harcèlement':
      return hit
        ? { applies: true, kind: 'vex', detail: `Ta prochaine attaque contre ${target} a l’avantage avant la fin de ton prochain tour.` }
        : { applies: false, kind: 'none', detail: 'Harcèlement exige une touche qui inflige des dégâts.' };
  }
}

export type MasteryClassId = 'barbare' | 'guerrier' | 'paladin' | 'rodeur' | 'roublard';

export function weaponMasteryCount(classId: string, level: number): number {
  switch (classId) {
    case 'guerrier':
      return level >= 16 ? 6 : level >= 10 ? 5 : level >= 4 ? 4 : 3;
    case 'barbare':
      return level >= 4 ? 3 : 2;
    case 'paladin':
    case 'rodeur':
    case 'roublard':
      return 2;
    default:
      return 0;
  }
}

export function isWeaponEligibleForMastery(classId: string, weapon: MasteryWeapon): boolean {
  if (classId === 'barbare') return weapon.melee;
  if (classId === 'roublard') {
    return weapon.cat === 'simple' || Boolean(weapon.finesse) || /(?:^|,\s*)légère(?:,|$)/i.test(weapon.props);
  }
  return ['guerrier', 'paladin', 'rodeur'].includes(classId);
}
