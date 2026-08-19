export interface DamageProfile {
  immunities?: readonly string[];
  resistances?: readonly string[];
  vulnerabilities?: readonly string[];
  conditions?: readonly { label: string }[];
}

export interface DamageResolution {
  final: number;
  label: string;
  immune: boolean;
  resistant: boolean;
  vulnerable: boolean;
}

export function resolveDamageAmount(
  profile: DamageProfile,
  amount: number,
  type: string | null,
): DamageResolution {
  const base = Math.max(0, Number.isFinite(amount) ? amount : 0);
  const immune = Boolean(type && (profile.immunities ?? []).includes(type));
  if (immune) {
    return {
      final: 0,
      label: `immunisé (${type})`,
      immune: true,
      resistant: false,
      vulnerable: false,
    };
  }

  const conditionLabels = new Set((profile.conditions ?? []).map(({ label }) => label));
  const resistanceToAll = conditionLabels.has('Pétrifié');
  const rageResistance = conditionLabels.has('Rage') && Boolean(type && ['contondants', 'perforants', 'tranchants'].includes(type));
  const resistant = resistanceToAll || rageResistance || Boolean(type && (profile.resistances ?? []).includes(type));
  const vulnerable = Boolean(type && (profile.vulnerabilities ?? []).includes(type));
  const afterResistance = resistant ? Math.floor(base / 2) : base;
  const final = vulnerable ? afterResistance * 2 : afterResistance;
  const labels: string[] = [];
  if (resistant) labels.push(type ? `résistant (${type})` : 'résistant');
  if (vulnerable) labels.push(`vulnérable (${type})`);

  return { final, label: labels.join(' puis '), immune, resistant, vulnerable };
}

export function concentrationDifficulty(damageTaken: number): number {
  const damage = Math.max(0, Math.floor(Number.isFinite(damageTaken) ? damageTaken : 0));
  return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}
