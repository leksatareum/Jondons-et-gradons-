export function subclassMaxHpBonus(
  classId: string | null | undefined,
  level: number,
  subclassName: string | null | undefined,
): number {
  if (classId !== 'ensorceleur' || subclassName !== 'Sorcellerie draconique' || level < 3) return 0;
  return level;
}

export function subclassHpGainAtLevel(
  classId: string,
  previousLevel: number,
  nextLevel: number,
  previousSubclass: string | null,
  nextSubclass: string | null,
): number {
  return subclassMaxHpBonus(classId, nextLevel, nextSubclass)
    - subclassMaxHpBonus(classId, previousLevel, previousSubclass);
}
