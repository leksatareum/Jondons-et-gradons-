export interface InvocationOption {
  id: string;
  name: string;
  desc: string;
  minLevel: number;
  requires?: string;
  repeatFor?: 'damage-cantrip' | 'ranged-damage-cantrip' | 'attack-cantrip' | 'origin-feat';
}

export const WARLOCK_INVOCATIONS_BY_LEVEL = [1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10];

export function warlockInvocationCount(level: number): number {
  return WARLOCK_INVOCATIONS_BY_LEVEL[Math.max(0, Math.min(19, Math.floor(level) - 1))];
}

export const ELDRITCH_INVOCATIONS: InvocationOption[] = [
  { id: 'agonizing-blast', name: 'Décharge agonisante', minLevel: 2, repeatFor: 'damage-cantrip', desc: 'Ajoute le modificateur de Charisme aux dégâts d’un sort mineur d’occultiste choisi.' },
  { id: 'armor-of-shadows', name: 'Armure des ombres', minLevel: 1, desc: 'Armure du mage sur toi-même sans emplacement.' },
  { id: 'ascendant-step', name: 'Pas ascendant', minLevel: 5, desc: 'Lévitation sur toi-même sans emplacement.' },
  { id: 'devils-sight', name: 'Vision du diable', minLevel: 2, desc: 'Vision normale dans la lumière faible et les ténèbres, magiques ou non, à 36 m.' },
  { id: 'devouring-blade', name: 'Lame dévorante', minLevel: 12, requires: 'thirsting-blade', desc: 'La Lame assoiffée accorde deux attaques supplémentaires au lieu d’une.' },
  { id: 'eldritch-mind', name: 'Esprit occulte', minLevel: 1, desc: 'Avantage aux sauvegardes de Constitution pour maintenir la concentration.' },
  { id: 'eldritch-smite', name: 'Châtiment occulte', minLevel: 5, requires: 'pact-blade', desc: 'Une fois par tour avec l’arme de pacte, dépense un emplacement pour 1d8 de force par niveau + 1d8 et renverse une cible TG ou moins.' },
  { id: 'eldritch-spear', name: 'Lance occulte', minLevel: 2, repeatFor: 'ranged-damage-cantrip', desc: 'La portée d’un sort mineur d’occultiste infligeant des dégâts et ayant une portée d’au moins 3 m augmente de 9 m par niveau d’occultiste.' },
  { id: 'fiendish-vigor', name: 'Vigueur fiélonne', minLevel: 2, desc: 'Simulacre de vie sur toi-même sans emplacement, avec le maximum du dé de PV temporaires.' },
  { id: 'gaze-of-two-minds', name: 'Regard des deux esprits', minLevel: 5, desc: 'Perçois par les sens d’un allié et peux lancer depuis son espace sous conditions.' },
  { id: 'gift-of-the-depths', name: 'Don des profondeurs', minLevel: 5, desc: 'Respiration aquatique, vitesse de nage égale à ta vitesse et Respiration aquatique gratuite une fois par repos long.' },
  { id: 'gift-of-the-protectors', name: 'Don des protecteurs', minLevel: 9, requires: 'pact-tome', desc: 'Les noms inscrits dans le Livre des ombres peuvent tomber à 1 PV au lieu de 0, une fois par repos long pour le groupe.' },
  { id: 'investment-chain-master', name: 'Investissement du maître de la Chaîne', minLevel: 5, requires: 'pact-chain', desc: 'Améliore déplacement, attaque, dégâts, DD et résistance du familier de pacte.' },
  { id: 'lessons-first-ones', name: 'Leçons des Premiers', minLevel: 2, repeatFor: 'origin-feat', desc: 'Accorde un don d’origine différent à chaque acquisition.' },
  { id: 'lifedrinker', name: 'Buveuse de vie', minLevel: 9, requires: 'pact-blade', desc: 'Une fois par tour, +1d6 nécrotique, psychique ou radiant avec l’arme de pacte ; peut dépenser un dé de vie pour se soigner.' },
  { id: 'mask-many-faces', name: 'Masque aux mille visages', minLevel: 2, desc: 'Déguisement sans emplacement.' },
  { id: 'master-myriad-forms', name: 'Maître des mille formes', minLevel: 5, desc: 'Métamorphose mineure sans emplacement.' },
  { id: 'misty-visions', name: 'Visions brumeuses', minLevel: 2, desc: 'Image silencieuse sans emplacement.' },
  { id: 'one-with-shadows', name: 'Un avec les ombres', minLevel: 5, desc: 'Invisibilité sur toi-même sans emplacement dans la lumière faible ou les ténèbres.' },
  { id: 'otherworldly-leap', name: 'Bond d’outre-monde', minLevel: 2, desc: 'Saut sur toi-même sans emplacement.' },
  { id: 'pact-blade', name: 'Pacte de la Lame', minLevel: 1, desc: 'Invoque ou lie une arme de mêlée, maîtrisée et focaliseur ; attaque avec le Charisme et choisit son type de dégâts.' },
  { id: 'pact-chain', name: 'Pacte de la Chaîne', minLevel: 1, desc: 'Familier gratuit avec formes spéciales ; sacrifie une attaque pour le faire attaquer en réaction.' },
  { id: 'pact-tome', name: 'Pacte du Grimoire', minLevel: 1, desc: 'Livre des ombres : trois sorts mineurs et deux rituels de niveau 1 de n’importe quelle classe.' },
  { id: 'repelling-blast', name: 'Décharge répulsive', minLevel: 2, repeatFor: 'attack-cantrip', desc: 'Une cible G ou moins touchée par le sort mineur choisi peut être repoussée de 3 m.' },
  { id: 'thirsting-blade', name: 'Lame assoiffée', minLevel: 5, requires: 'pact-blade', desc: 'Attaque supplémentaire avec l’arme de pacte.' },
  { id: 'visions-distant-realms', name: 'Visions des royaumes lointains', minLevel: 9, desc: 'Œil magique sans emplacement.' },
  { id: 'whispers-grave', name: 'Murmures de la tombe', minLevel: 7, desc: 'Communication avec les morts sans emplacement.' },
  { id: 'witch-sight', name: 'Vision de sorcier', minLevel: 15, desc: 'Vision lucide à 9 m.' },
];

export interface InvocationExpansionContext {
  level: number;
  selectedIds: string[];
  damageCantrips: { id: string; name: string }[];
  // Facultatif : les appelants antérieurs ne distinguaient pas les sorts mineurs
  // à distance. Sans cette liste, Lance occulte se rabat sur les sorts à dégâts.
  rangedDamageCantrips?: { id: string; name: string }[];
  attackCantrips: { id: string; name: string }[];
  originFeats: { id: string; name: string }[];
}

export function invocationBaseId(optionId: string): string {
  return optionId.split('@')[0];
}

export function invocationByOptionId(optionId: string): InvocationOption | undefined {
  const baseId = invocationBaseId(optionId);
  return ELDRITCH_INVOCATIONS.find((invocation) => invocation.id === baseId);
}

export function eligibleInvocationOptions(context: InvocationExpansionContext): { id: string; name: string; desc: string }[] {
  const selectedBases = new Set(context.selectedIds.map(invocationBaseId));
  return ELDRITCH_INVOCATIONS.flatMap((invocation) => {
    if (context.level < invocation.minLevel) return [];
    if (invocation.requires && !selectedBases.has(invocation.requires)) return [];
    if (invocation.repeatFor === 'damage-cantrip') {
      return context.damageCantrips.map((cantrip) => ({ id: `${invocation.id}@${cantrip.id}`, name: `${invocation.name} · ${cantrip.name}`, desc: invocation.desc }));
    }
    if (invocation.repeatFor === 'ranged-damage-cantrip') {
      return (context.rangedDamageCantrips || context.damageCantrips).map((cantrip) => ({ id: `${invocation.id}@${cantrip.id}`, name: `${invocation.name} · ${cantrip.name}`, desc: invocation.desc }));
    }
    if (invocation.repeatFor === 'attack-cantrip') {
      return context.attackCantrips.map((cantrip) => ({ id: `${invocation.id}@${cantrip.id}`, name: `${invocation.name} · ${cantrip.name}`, desc: invocation.desc }));
    }
    if (invocation.repeatFor === 'origin-feat') {
      return context.originFeats.map((feat) => ({ id: `${invocation.id}@${feat.id}`, name: `${invocation.name} · ${feat.name}`, desc: invocation.desc }));
    }
    return [{ id: invocation.id, name: invocation.name, desc: invocation.desc }];
  });
}
